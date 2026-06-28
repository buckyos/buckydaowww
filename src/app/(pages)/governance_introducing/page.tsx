'use client'
import { LoadingOutlined } from '@ant-design/icons'
// import { useAsyncEffect } from 'ahooks'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function GovernanceIntroducing() {
  const [markdown] = useState<string>(`
# Basic Information

- **Name**: BuckyDAO
- **Goal**: BuckyDAO Buckyos is a Cloud OS (Network OS) for everyone. Its primary design goal is to allow consumers to have their own cluster/cloud (we call this cluster Zone).Consumers can install Service in their own Zone just like installing App. Based on buckyos, users can have AI Agents that can access all their data, devices, and services.

- **DAO Token name**: BST (Buckyos Sourcedao Token)

# BuckyDAO Governance Principles

1. The decision-making rules of the DAO should ensure that all proposals can inevitably reach a decision.
2. The decision-making rules of the DAO should prevent the tyranny of the majority.
3. The basic rules (constitution) of the DAO cannot be fundamentally modified after creation.
4. In case of an impasse, the conflicting party can choose to fork.

# DAO Token Economics

- **Total supply**: 2.1 billion
- **Can increase supply**: YES (equity increase model); 1 billion tokens will be released upon achieving the original goal as planned. Afterward, additional tokens can be issued with authorization based on milestone versions.

## BST allocation

1. Initial team (5%)
2. Mining through development  (66%)
3. Marketing (9%)
4. Investors (20%)

## Acquiring Tokens

All tokens are currently in a waiting-to-be-released state according to the above rules. As we progress along the roadmap, participants who contribute to the project will receive contribution values, which convert into tradable tokens after project acceptance.

### Obtaining Tokens through Investment

When reaches a certain stage as planned, financing can be initiated based on the roadmap: selling unreleased BST using financing contracts. The conditions for each round of financing will differ, and tokens obtained from investment may have locking conditions.

## Token Rights

BST holders can participate in DAO governance and influence DAO operations through the DAO voting mechanism.

## Token Returns (Dividends)
Our DAO organization has assets, which primarily increase in the following ways:

1. Donations. As an open-source project, we accept cryptocurrency donations.
2. Income. Our product can generate income (freedom does not necessarily mean completely free), resulting in digital currency revenue.
3. Financing. In most cases, assets obtained through public financing are not considered income. However, our rules allow a portion of each round of financing (specified during public financing) to purchase existing DAO members' tokens or become a dividable income.
All revenue mentioned above is published based on financial transparency rules. The DAO organization will periodically put assets belonging to the DAO into a dividend asset pool. During a dividend cycle, users who wish to participate in dividends can deposit BST into the dividend pool and exchange assets in proportion. Generally, the dividend pool will set a limit on the number of BST eligible for dividends and adopt a first-come-first-served basis.

# Basic Operating Procedures
1. The DAO is established with the goals, initial BST allocation, initial members, and initial roadmap set.
2. The roadmap illustrates the relationship between system maturity and BST releases: the more mature the system, the more BST released. From a software engineering perspective, the roadmap outlines the project's rough plan, divided into five stages: PoC, MVP, Alpha, Beta, Formula (Product Release), each with corresponding BST release plans.
3. Mining through development : this is the primary phase for the DAO to achieve its goals. For the roadmap to progress to the next stage, community developers need to cooperate closely. The DAO will prepare a budget and plan according to traditional software project management procedures and regularly calculate contribution values of project participants. Contributors will receive BST based on their contribution ratio after project acceptance.
4. BST can also be used for marketing activities to increase project visibility. Its primary incentive principle is to motivate new users (e.g., engineers who give us stars on Github) or reward design for the introduction of new friends who bring new engineers and new users to the project.
5. Hold BST and participate in DAO governance.
6. Based on BST, public financing is conducted to obtain resources of other asset types for the DAO organization.


# Decision Mechanism
## Transaction Classification
DAO transactions are divided into internal project affairs, routine DAO affairs, important DAO affairs, and major DAO affairs.
Internal project affairs are decided by the project leader or designated person, while routine DAO affairs are voted on by the committee. Important and major DAO affairs are decided by all BST holders. The difference between important and major affairs is the minimum voter turnout rate required for the DAO vote (the number of liquid BST participating in the vote). The minimum voter turnout rate for important affairs is 30% of liquid BST, while major affairs require a minimum voter turnout rate of 40%.

## DAO Voting
The design of the voting mechanism is a hot topic in the implementation of DAOs, and we hope to find a mechanism that is:

1. Convenient and low-cost to vote, which can increase voter turnout
2. Provides some incentives for voting


Mortgaging BST can obtain DAO votes (2000 BST can be mortgaged for one vote). These votes are automatically redeemed for BST upon use (abstaining is also considered use). Certain BST that are in a locked state (not allowed to be traded) can also be mortgaged to obtain votes, but these votes cannot be transferred.
Please note that using your vote means voting on the proposal and waiting for the proposal to end (which usually takes 14 days).


## Decision-making Process
All DAO transactions, except for internal affairs, follow the process below:

1. Proposal: Only committee members are eligible to initiate proposals, but non-committee members can make proposals by mortgaging BST. The amount of BST required for different types of issues varies.
2. Proposals can have a designated deadline for voting (not less than 14 days; major proposals require at least 21 days). Once all committee members have voted on routine DAO affairs, the automatic result will take effect.
3. After the proposal reaches the voting deadline, there are three possible outcomes: agreement, rejection, or failure to meet the minimum voter turnout rate (if the proposal was initiated through pledging BST, the tokens will be returned to the proposer).
4. Some proposals are "contract proposals," such as changing parameters in a particular contract. Once these proposals are approved, they will be executed automatically.
5. For non-contract proposals, after approval, they will enter the execution phase and be assigned to specific individuals for processing.
6. Once the proposer has completed the proposal operation, they can mark the proposal as completed.
7. There is currently no provision for reconsidering completed proposals.


# Membership
## Committee
The committee consists of no less than three members, and the number of committee members must be an odd number. Committee members are elected through voting on major affairs and serve a 12-month term (re-election is allowed). The committee is the primary body for daily decision-making in the DAO and handles routine DAO affairs through committee member voting. At least one formal public meeting must be held every quarter to discuss the overall development of the DAO.

### Alternate Committee Members
One to three alternate committee members (with priority) can be elected under the same conditions. Alternate committee members can participate in all committee activities but do not have voting rights.
### Dismissal of Committee Members
Anyone can propose the dismissal of a committee member through a major proposal. Once the proposal is approved, the committee member immediately loses their position. In this case, the committee must elect a temporary replacement from the alternate committee members within 14 days (the term of the replacement will inherit that of the dismissed committee member). If the committee cannot make the election (due to an even number of remaining committee members), then the alternate committee members will be ranked based on priority, and the highest-priority member will be selected as the replacement.
Additionally, committee members can resign voluntarily, which will take effect upon approval by the committee and result in the loss of their position.
### Secretary-General of the Committee
The secretary-general must be a committee member and is responsible for organizing the committee's work in accordance with the charter, particularly in terms of written records and publicizing the committee's work.
During the period when other committee members lose their qualifications, the Secretary-General can take on additional responsibilities.

### Accountant of the Committee
The committee appoints an accountant to handle some financial matters in routine DAO affairs, serving a two-year term.
The committee accountant can receive income from the committee's budget on a monthly basis as per their appointment but does not have voting rights and can not hold other positions.

## CMO
The CMO must be a committee member.
He/She is responsible for developing and executing marketing plans.
Once approved, a portion of the unallocated tokens or other DAO assets will be allocated to the marketing budget for implementation. The CMO can decide how to use the resources in the budget on the basis of public disclosure.
After a marketing activity ends, it will be evaluated as terminated, failed, good, or excellent. If the evaluation is excellent, the CMO can decide to allocate the "bonus" portion of the budget. If three marketing activities fail during one term, the CMO automatically loses their position.
## CFO
The CFO must be a committee member.
Their main duties include budget preparation, asset custody system design, and proposing financial-related proposals. (Note that the CFO and the committee accountant are not the same person and do not have a superior-subordinate relationship.)
## Developer
Any developer who contributes more than 100 points to the Buckyos project automatically becomes a BuckyDAO Developer (lifetime tenure).

### Dismissal
1. Voluntary withdrawal.
2. Removal through a major proposal.


## Core Developer
Buckyos is an open-source organization where engineers are the primary members. Core Buckyos Developers are the core contributors to Buckyos's development and also full-time participants in the DAO.
As such, they receive fixed income every two weeks based on their current level and the DAO's financial allocation. The project manager can assign work to Core Developers, and they can also hold other DAO positions.

### Appointment
Any Developer can apply to become a Core Buckyos Developer.
The qualification will take effect at the designated time after approval by the committee, serving a term of two years (with automatic reappointment allowed). Core Developers are evaluated every two months, and they pass the evaluation if they complete any of the following tasks:

1. All assigned tasks have been accepted.
2. Contributions exceed 70% of the required contributions for their level.
3. Contributions exceed the average for the current period.
### Dismissal
Voluntary resignation with committee approval or failure to pass three evaluations during one term (two years) result in automatic dismissal. The committee can also remove Core Developers through a resolution.

# Financial Management
## Financial Process
1. Establish multiple-account wallets for the DAO, divided into development wallet, market wallet, financing wallet, and committee daily work wallet.
2. Each account wallet of the DAO uses multi-signature authentication, with at least three committee members designated as administrators to approve all transactions. All transactions must be signed by two administrators to execute.
3. Establish budgets and expenditure plans, update each stage or quarter and submit them to DAO members for voting approval.
4. All income should be deposited in the DAO financing wallet and recorded promptly in the DAO's financial records.

## Types of Funding
Financial expenditures are divided into phase budget allocations and ad-hoc project allocations:
1. Phase budget allocations include the necessary funding for marketing, development, administration, etc., and are proposed by the Secretary-General of the Committee. The budget for each phase is subject to an important transaction voting process.
2. Ad-hoc project allocations are used for non-routine or emergency project expenses outside the quarterly budget. They are initiated by committee members or Core Developers, voted on by a majority of committee members, and publicly disclosed. The amount of ad-hoc allocation should be within the scope of the current financial system design.

## Financial Record Keeping
1. The committee has a CFO responsible for recording, managing, and supervising financial records and accounts, ensuring accuracy and completeness.
2. All financial records should be promptly and transparently disclosed, including quarterly financial reports, monthly income and expenditure statements, and transaction records.

## Internal Audit
1. The DAO should establish an internal audit program to supervise the implementation of financial processes and ensure that all transactions comply with DAO financial standards and procedures.
2. When there is a change in DAO membership, an audit of the multi-signature wallets held by the former members is necessary.
3. All DAO members have an obligation to provide necessary financial information and data to internal auditors.


## Transparency and Reporting Responsibility
1. The DAO should always maintain a high level of transparency, allowing all participants to understand the organization's financial status and providing them with the opportunity to review all decisions and transactions.
2. DAO financial records and reports should be publicly released in the DAO community for all participants to access.
3. The DAO financial supervisor should regularly present quarterly financial reports and other important financial information to DAO members and answer related questions.

## Information Security and Privacy
1. DAO multi-signature wallets should be stored on offline devices to ensure that private keys are not obtained by hackers.
2. Committee members must not disclose any non-public financial information or data related to the DAO to protect necessary privacy and potential interests.


# Project Development Process
Buckyos is an open-source organization, and therefore project development process is the primary workflow. The DAO follows the principle of prioritizing efficiency in the early stage and stability and fairness in the later stage. At the level of DAO rules, specific work is delegated to relevant responsible persons instead of designing too many details.

## Basic Process
1. Project Planning: Based on the Roadmap plan, the committee discusses the number of projects needed to achieve the goals of the current stage as much as possible and discusses it at the committee meeting. Once the project planning is approved, the project moves into project preparation, where the key goal is to select the project manager. The project manager must be a Core Developer.
2. Project Initiation: After determining the project manager, the project manager initiates the project initiation. The format of the initiation document is not limited, but the most important thing is the budget package (where those who contribute to the project receive their mining income from), the project personnel, and the start and end dates.
3. Discussion and Approval: After the project manager submits the initiation document, the committee discusses (emphasized) and votes to approve it. For important projects, DAO vote approval is required according to significant transaction requirements.
4. Actual Plan Designation: The project manager begins to confirm the actual plan of the project, with the main work being the list of participants and specific task design. When designing tasks, it is necessary to design the contribution value. Guidance for contribution value design is provided in the Buckyos Project Management Manual.
5. Project Execution: Enter the execution phase, where the goal is to complete all tasks and have the project manager mark the project as completed.
6. Project Acceptance: If the project manager marks the project as completed, it enters the acceptance stage. Regular projects are accepted by the committee, while important projects are accepted by DAO voting. The acceptance levels are: fail, poor, good, or excellent.
7. Project team members receive token rewards based on contribution value. The basic formula is the actual project budget * (personal contribution value/total contribution value). Actual project budget = initial project budget * acceptance level.


## Bounty Tasks
The project can contain multiple features, some of which come from planning (GitHub issues), and some come from user bounties. Once a feature containing a bounty has been accepted, members of the project team can receive the bounty according to the principle of contribution value allocation.
  `)

  // useAsyncEffect(async () => {
  //   const resp = await fetch('/api/introducing')
  //   const data = await resp.json()
  //   setMarkdown(data.content)
  // }, [])

  if (!markdown) {
    return (
      <div className='flex-center'>
        <LoadingOutlined />
      </div>
    )
  }

  return (
    <section className='w-full my-6 px-4 lg:px-6'>
      <div className='markdown-body-light py-10 max-w-none'>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </section>
  )
}
