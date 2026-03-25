type StateExplanationTone = 'info' | 'success' | 'warning' | 'danger'

const toneClasses: Record<
  StateExplanationTone,
  {
    border: string
    background: string
    badge: string
  }
> = {
  info: {
    border: 'border-[#D6E4FF]',
    background: 'bg-[#F5F9FF]',
    badge: 'bg-[#E6F4FF] text-[#0958D9]',
  },
  success: {
    border: 'border-[#D9F7BE]',
    background: 'bg-[#F6FFED]',
    badge: 'bg-[#D9F7BE] text-[#389E0D]',
  },
  warning: {
    border: 'border-[#FFE7BA]',
    background: 'bg-[#FFF7E6]',
    badge: 'bg-[#FFE7BA] text-[#D46B08]',
  },
  danger: {
    border: 'border-[#FFCCC7]',
    background: 'bg-[#FFF1F0]',
    badge: 'bg-[#FFCCC7] text-[#CF1322]',
  },
}

interface StateExplanationCardProps {
  heading: string
  status: string
  why: string[]
  next: string[]
  tone?: StateExplanationTone
}

export default function StateExplanationCard({
  heading,
  status,
  why,
  next,
  tone = 'info',
}: StateExplanationCardProps) {
  const classes = toneClasses[tone]

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${classes.border} ${classes.background}`}
    >
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div>
          <div className='text-xs font-medium uppercase tracking-[0.16em] text-[#8C8C8C]'>
            {heading}
          </div>
          <div className='mt-2'>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${classes.badge}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className='mt-5 grid gap-4 lg:grid-cols-2'>
        <div className='rounded-xl bg-white/80 p-4'>
          <div className='text-sm font-semibold text-black-primary'>Why</div>
          <ul className='mb-0 mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-black-secondary'>
            {why.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className='rounded-xl bg-white/80 p-4'>
          <div className='text-sm font-semibold text-black-primary'>Next</div>
          <ul className='mb-0 mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-black-secondary'>
            {next.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
