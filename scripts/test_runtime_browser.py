#!/usr/bin/env python3
"""Verify a built site's runtime network config before any wallet/RPC access.

Requires Playwright 1.59.0 + Chromium. Uses only a temporary local web server and
intercepts all RPC/API traffic; no real wallet, account or chain is contacted.
"""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--app', type=Path, default=Path(__file__).resolve().parents[1] / 'src')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='sourcedao-browser-') as temporary:
        root = Path(temporary)
        config = {'CHAIN': 'USDB Runtime Test A', 'NETWORK_ID': '202608250', 'RPC_URL': 'https://rpc.sourcedao.test/rpc',
                  'ADDRESS_LINK': 'https://explorer.sourcedao.test/address/', 'TOKEN_ADDRESS_LINK': 'https://explorer.sourcedao.test/token/',
                  'LOCAL_AUTH_MODE': 'github', 'CURRENCY_NAME': 'USDB', 'CURRENCY_SYMBOL': 'USDB'}
        for index, key in enumerate(['MAIN', 'COMMITTEE', 'PROJECT', 'DEV_TOKEN', 'NORMAL_TOKEN', 'LOCKUP', 'DIVIDEND', 'ACQUIRED'], 1):
            config[key] = '0x' + str(index) * 40
        file = root / 'public.json'
        file.write_text(json.dumps(config))
        rpc_networks = {config['RPC_URL']: config['NETWORK_ID']}
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        origin = f'http://127.0.0.1:{port}'
        with (root / 'server.log').open('w') as log:
            server = subprocess.Popen(['node', 'node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', str(port)],
                                      cwd=args.app, env={**os.environ, 'SOURCEDAO_PUBLIC_CONFIG': str(file)}, stdout=log, stderr=log)
            try:
                for _ in range(100):
                    try:
                        urllib.request.urlopen(origin, timeout=1).close()
                        break
                    except OSError:
                        if server.poll() is not None:
                            raise AssertionError((root / 'server.log').read_text())
                        time.sleep(.2)
                with sync_playwright() as playwright:
                    browser = playwright.chromium.launch(headless=True)
                    page = browser.new_page()
                    attempted = []
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    def route(request):
                        target = request.request.url
                        if target.startswith(origin + '/api/'):
                            request.fulfill(json={'code': 0, 'data': {}, 'items': []})
                        elif target.startswith(origin):
                            request.continue_()
                        else:
                            attempted.append(target)
                            if target in rpc_networks:
                                def answer(call):
                                    method = call['method']
                                    if method == 'eth_chainId':
                                        value = hex(int(rpc_networks[target]))
                                    elif method == 'eth_call':
                                        data = call['params'][0].get('data', '')
                                        value = ('0x' + f'{32:064x}' + f'{4:064x}' + '55534442' + '0' * 56) if data == '0x95d89b41' else '0x' + f'{18:064x}'
                                    else:
                                        value = '0x0'
                                    return {'jsonrpc': '2.0', 'id': call['id'], 'result': value}
                                payload = request.request.post_data_json
                                request.fulfill(json=[answer(call) for call in payload] if isinstance(payload, list) else answer(payload))
                            else:
                                request.abort()
                    page.route('**/*', route)
                    page.goto(origin + '/token')
                    expect(page.get_by_text('USDB Runtime Test A', exact=True)).to_be_visible()
                    expect(page.get_by_text('Network 202608250', exact=True)).to_be_visible()
                    expect(page.get_by_text('Login with GitHub', exact=True)).to_be_visible()
                    assert any(target == config['RPC_URL'] for target in attempted), attempted
                    assert not any('optimism' in target or ':8545' in target for target in attempted), attempted
                    config['CHAIN'] = 'USDB Runtime Test B'
                    config['NETWORK_ID'] = '202608251'
                    config['RPC_URL'] = 'https://rpc.sourcedao.test/rpc-b'
                    rpc_networks[config['RPC_URL']] = config['NETWORK_ID']
                    file.write_text(json.dumps(config))
                    page.reload()
                    expect(page.get_by_text('USDB Runtime Test B', exact=True)).to_be_visible()
                    expect(page.get_by_text('Network 202608251', exact=True)).to_be_visible()
                    assert not errors, errors
                    browser.close()
            finally:
                server.terminate()
                server.wait(timeout=10)
    print('Runtime configuration browser checks passed without a rebuild.')


if __name__ == '__main__':
    main()
