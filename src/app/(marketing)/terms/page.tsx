import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="bg-white px-4 py-12">
      <div className="prose mx-auto">
        <div className="font-bold underline">
          <p>
            THE INTERFACES ARE FRONTENDS THAT ALLOW YOU TO DISCOVER AND INTERACT
            WITH CERTAIN SMART CONTRACTS AND RELATED TOOLS (THE
            &ldquo;PROTOCOL&rdquo; AS DEFINED BELOW). NEITHER THE COMPANY NOR
            THE INTERFACES OWN, CONTROL, OPERATE, OR MAINTAIN THE PROTOCOL OR
            ANY UNDERLYING BLOCKCHAIN OR SMART CONTRACT INFRASTRUCTURE. NEITHER
            THE COMPANY NOR THE INTERFACES IS A BROKER, FINANCIAL INSTITUTION,
            OR INTERMEDIARY AND IS IN NO WAY YOUR AGENT, ADVISOR, OR CUSTODIAN.
            NEITHER THE COMPANY NOR THE INTERFACES CAN INITIATE A TRANSFER OF
            ANY OF YOUR DIGITAL ASSETS OR OTHERWISE ACCESS YOUR DIGITAL ASSETS.
            THE COMPANY HAS NO FIDUCIARY RELATIONSHIP OR OBLIGATION TO YOU
            REGARDING ANY DECISIONS OR ACTIVITIES THAT YOU EFFECT IN CONNECTION
            WITH YOUR USE OF THE PROTOCOL.
          </p>

          <p>
            THE INTERFACE DOES NOT HOST, MAINTAIN OR PARTICIPATE IN ANY
            TRANSACTIONS ON ANY THIRD PARTY PLATFORM ACCESSIBLE ON THE
            INTERFACE, IS NOT IN ANY WAY ASSOCIATED WITH OPERATORS OF ANY THIRD
            PARTY PLATFORM, AND HAS NO CONTROL OVER THE OPERATION OF THE THIRD
            PARTY PLATFORMS.
          </p>

          <p>
            THE COMPANY IS NOT LICENSED OR REGULATED BY ANY FINANCIAL REGULATORY
            AUTHORITY TO PROVIDE REGULATED FINANCIAL SERVICES. THE SERVICES ARE
            NOT OFFERED AS, AND ARE NOT INTENDED TO CONSTITUTE, REGULATED
            FINANCIAL SERVICES. IT IS YOUR RESPONSIBILITY TO DETERMINE WHETHER
            YOUR USE OF THE INTERFACES IS PERMITTED UNDER THE LAWS AND
            REGULATIONS THAT APPLY TO YOU.
          </p>

          <p>
            YOU ACKNOWLEDGE THAT YOU ARE SOLELY INTERACTING WITH SMART CONTRACTS
            AND ARE NOT OBTAINING ANY SERVICE FROM OR ENTERING INTO ANY
            CONTRACTUAL OBLIGATIONS WITH THE COMPANY OR ANY OTHER PARTICIPANT
            THROUGH THE INTERFACE.
          </p>

          <p>
            THE COMPANY DOES NOT ENDORSE OR APPROVE AND MAKES NO WARRANTIES,
            REPRESENTATIONS OR UNDERTAKINGS RELATING TO THE CONTENT AND SERVICES
            OF ANY THIRD-PARTY PLATFORMS OR TO THE PROTOCOL.
          </p>

          <p>
            YOUR USE OF THE INTERFACE MAY BE SUBJECT TO SUPPLEMENTAL TERMS,
            WHICH CAN EITHER BE LISTED IN THIS TERMS OR WILL BE PRESENTED TO YOU
            FOR YOUR ACCEPTANCE WHEN YOU USE THE SPECIFIC SUPPLEMENTAL SERVICE
            OR PRODUCT. IN THE EVENT OF ANY CONFLICT BETWEEN THIS TERMS AND THE
            SUPPLEMENTAL TERMS, THE SUPPLEMENTAL TERMS SHALL GOVERN AND CONTROL
            WITH RESPECT TO SUCH SERVICE.
          </p>

          <p>
            BY USING THE INTERFACES YOU AGREE THAT ANY DISPUTES WILL BE RESOLVED
            BY FINAL AND BINDING ARBITRATION ON AN INDIVIDUAL BASIS, AS
            DESCRIBED IN CLAUSE 10.2 BELOW, AND YOU WAIVE ANY RIGHT TO
            PARTICIPATE IN A CLASS ACTION.
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          Terms of Service
        </h1>

        <p>Dated: January 26, 2026</p>

        <p>
          These Terms of Service (the &ldquo;<strong>Agreement</strong>&rdquo;
          or the &ldquo;<strong>Terms</strong>&rdquo;) explain the terms and
          conditions by which you (&ldquo;<strong>You</strong>&rdquo;, &ldquo;
          <strong>Yours</strong>&rdquo; or &ldquo;<strong>User</strong>&rdquo;)
          may access and use the interfaces, which is maintained by us,{" "}
          <strong>Polar Express Limited</strong> (referred to herein as the
          &ldquo;<strong>Company</strong>&rdquo;, &ldquo;<strong>we</strong>
          &rdquo;, &ldquo;<strong>our</strong>&rdquo;, or &ldquo;
          <strong>us</strong>&rdquo;) (the &ldquo;<strong>Interfaces</strong>
          &rdquo;). The Interfaces enable Users to interact with the Protocol
          (as defined below) and any third party platforms, not owned by the
          Company. The Interfaces shall include, but shall not necessarily be
          limited to,{" "}
          <a
            href="https://app.near-intents.org/"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://near-intents.org/
          </a>{" "}
          a.k.a. &ldquo;near-intents&rdquo;{" "}
          <a
            href="https://solswap.org/"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://solswap.org/
          </a>{" "}
          a.k.a. &ldquo;solswap&rdquo;{" "}
          <a
            href="https://dogecoinswap.org/"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://dogecoinswap.org/
          </a>{" "}
          a.k.a. &ldquo;Dogecoinswap&rdquo;,{" "}
          <a
            href="https://turboswap.org/"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://turboswap.org/
          </a>{" "}
          a.k.a. &ldquo;Turboswap&rdquo;,{" "}
          <a
            href="https://trump-swap.org/"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://trump-swap.org/
          </a>{" "}
          a.k.a. &ldquo;Trumpswap&rdquo;, and the website-hosted user interfaces
          (and all features available via the Interfaces). The Interfaces
          provide access to the Protocol, which is not controlled or operated by
          the Company.
        </p>

        <p>
          You must read this Agreement carefully as it governs Your use of the
          Interfaces. By accessing or using any of the Interfaces, You signify
          that You have read, understand, and agree to be bound by this
          Agreement in its entirety and to the Privacy Policy (as defined in
          clause 11.5). If You do not agree, You are not authorized to access or
          use any of the Interfaces and should not use the Interfaces.
        </p>

        <p>
          For purposes of this Agreement, the following terms have the meanings
          set forth below:
        </p>

        <h2>1. Definitions</h2>

        <p>
          <strong>&ldquo;Intent&rdquo;</strong>: A User&rsquo;s declarative
          instruction, expressed in a standardized format recognized by the
          Protocol, that specifies the desired outcome of a transaction or
          series of transactions without prescribing the method of execution. An
          Intent may include parameters such as asset type, quantity, timing, or
          other conditions, and is designed to be fulfilled by one or more
          Solvers through on-chain settlement.
        </p>

        <p>
          <strong>&ldquo;Interface Fee&rdquo;</strong> as defined in clause 2.2.
        </p>

        <p>
          <strong>&ldquo;Solver&rdquo;</strong>: Any service, software agent,
          algorithmic or artificial intelligence–assisted system, or
          human-operated entity that, within the Solver Network and Protocol,
          receives an Intent and translates such Intent into one or more
          executable on-chain transactions. A Solver is responsible for
          determining the method of execution, including sourcing liquidity,
          routing, or composing multiple actions, and for submitting the
          resulting transaction(s) for settlement on the applicable blockchain.
          Solvers may operate autonomously or under human supervision and may be
          compensated or rewarded for successful fulfillment of such intent.
        </p>

        <p>
          <strong>&ldquo;Solver Bus API&rdquo;</strong>: A communication layer
          connecting Solvers to the Protocol.
        </p>

        <p>
          <strong>&ldquo;Solver Network&rdquo;</strong>: The collective
          framework of independent Solvers, whether software-based, algorithmic,
          artificial intelligence–assisted systems, or human-operated entities
          that participate within the Protocol to receive, compete for, and
          fulfill Intents. The Solver Network functions as a marketplace of
          execution services, where Solvers may operate autonomously or under
          human supervision and are compensated or rewarded for the successful
          settlement of Intents on the applicable blockchain.
        </p>

        <p>
          <strong>&ldquo;Slippage&rdquo;</strong>: The difference between the
          displayed estimated price of a transaction and the actual price at
          which the transaction is executed. Slippage can occur due to market
          volatility, low liquidity, other market conditions, or delays in
          transaction processing.
        </p>

        <p>
          <strong>&ldquo;Verifier Contract&rdquo;</strong>: The NEAR-based smart
          contract that validates and authorizes Intent execution.
        </p>

        <p>
          <strong>&ldquo;HOT Bridge&rdquo;</strong>: A cross-chain bridge
          enabling asset transfers between NEAR Protocol and other blockchains,
          leveraging Chain Signatures, known as the &ldquo;HOT Bridge&rdquo;,
          further details of which are available at{" "}
          <a
            href="https://docs.hotdao.ai/white-paper/hot-bridge"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://docs.hotdao.ai/white-paper/hot-bridge
          </a>
          .
        </p>

        <p>
          <strong>&ldquo;IP Owner(s)&rdquo;</strong> means the respective rights
          holders in the Interfaces and their proprietary elements, including,
          but not limited to, software, text, images, trademarks, service marks,
          copyrights, patents, and designs, other than open-source components.
        </p>

        <p>
          <strong>&ldquo;PoA Bridge&rdquo;</strong>: A cross-chain bridge
          enabling asset transfers between NEAR Protocol and other blockchains,
          known as the &ldquo;PoA Bridge&rdquo; or &ldquo;Proof of Authority
          Bridge&rdquo;, according to its specific terms and conditions, which
          are available at{" "}
          <a
            href="https://docs.google.com/document/d/1ckaY2zxh44UjQYT8LtsjQ6PpcGb7gzVv/edit"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://docs.google.com/document/d/1ckaY2zxh44UjQYT8LtsjQ6PpcGb7gzVv/edit
          </a>
        </p>

        <p>
          <strong>&ldquo;Omni Bridge&rdquo;</strong>: A cross-chain bridge
          enabling asset transfers between NEAR Protocol and other blockchains,
          leveraging Chain Signatures, known as the &ldquo;Omni Bridge&rdquo;,
          further details of which are available at{" "}
          <a
            href="https://docs.near.org/chain-abstraction/omnibridge/overview"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://docs.near.org/chain-abstraction/omnibridge/overview
          </a>
          .
        </p>

        <p>
          <strong>&ldquo;Chain Signatures&rdquo;</strong>: A cryptographic
          mechanism allowing NEAR accounts and contracts to sign transactions on
          and across multiple external blockchains by leveraging the MPC
          network.
        </p>

        <p>
          <strong>&ldquo;Cross-Chain Settlement&rdquo;</strong>: The process of
          finalizing Intent execution across multiple blockchains.
        </p>

        <p>
          <strong>&ldquo;MPC Network&rdquo;</strong> means the distributed
          network of participants that collectively generate threshold
          signatures through multi-party computation in respect of Chain
          Signatures. Each participant holds a share of a private key, and a
          threshold of participants must collaborate to produce a valid
          signature. The MPC Network is operated by third parties and is not
          owned, controlled, or operated by the Company.
        </p>

        <p>
          <strong>&ldquo;NEAR&rdquo;</strong>: The sharded, proof-of-stake,
          layer one blockchain, known as &ldquo;NEAR Protocol&rdquo;.
        </p>

        <p>
          <strong>&ldquo;Protocol&rdquo;</strong>: the smart contract/protocol
          deployed on NEAR Protocol which enables users to post, match, and
          settle Intents, to be executed by the Solver Network. The Protocol
          does not include any frontends (including, without limitation, the
          Interfaces), bridges (including any of the Bridges), the 1Click
          Service, or any other integrations, which are components operated by
          third parties.
        </p>

        <p>
          <strong>&ldquo;Liquidity Provider&rdquo;</strong>: An individual or
          legal entity that supplies digital assets to decentralized protocols
          to facilitate trading, swapping, or other financial operations, and
          may receive fees or rewards in return.
        </p>

        <p>
          <strong>&ldquo;Relayer&rdquo;</strong>: A service that broadcasts
          transactions to the blockchain networks on behalf of users, typically
          to optimize for gas costs or improve transaction success rates.
        </p>

        <p>
          <strong>&ldquo;1Click Service&rdquo; or &ldquo;1CS&rdquo;</strong>: A
          separate integration and service that facilitates simplified routing
          to the Protocol for certain Intents and may interact with Third-Party
          bridges, known as &ldquo;1Click Service&rdquo;, &ldquo;1Click
          Swap&rdquo; or &ldquo;1CS&rdquo;. 1CS is not part of the Interfaces
          and is not operated by the Company. Further details can be found at:{" "}
          <a
            href="https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api
          </a>
          .
        </p>

        <p>
          <strong>
            &ldquo;Third-Party Bridges&rdquo; or &ldquo;Bridges&rdquo;
          </strong>
          : Collectively, the PoA Bridge, the HOT Bridge, and the Omni Bridge,
          and any other bridges integrated with the Protocol and/or Interface
          from time to time. The Bridges are provided and operated by third
          parties and are not operated by the Company.
        </p>

        <h2>2. The Interfaces</h2>

        <p>
          The main purpose of the Interface is to provide you with access to the
          Protocol. We only provide the interface bridging to the software but
          have no control over your blockchain interactions and do not endorse
          any specific actions. All the transactions occur on third-party
          blockchains (&ldquo;<strong>Blockchain Networks</strong>&rdquo;) that
          we do not own, control, or operate. We are not responsible for the
          services provided by third parties, the execution of the transactions,
          or any other actions of such third parties. We reserve the right to
          make changes to the Interface, including adding, modifying, or
          discontinuing products or features.
        </p>

        <p>
          <strong>Products and Features.</strong> The Interface integrates the
          Protocol, which in turn integrates other protocols and offers you
          access to numerous liquidity sources across multiple chains. The
          Interface may include other products and/or features added for the
          purposes of user experience, including those for the informational,
          security, and entertainment purposes, which are not intended to affect
          the main purpose of the Interface described above. We only provide you
          with access to the relevant interface and neither have control over
          your interactions with the blockchain or the Protocol nor do we
          encourage you to perform any. Any interaction performed by you via the
          Interface remains your sole responsibility.
        </p>

        <p>
          The Interfaces are non-custodial tools that enable users to interact
          with the Protocol by providing web or mobile-based access. Through the
          Interfaces, users can declare desired outcomes (Intents) on various
          public blockchains, including but not limited to NEAR, Bitcoin,
          Ethereum, Arbitrum, Base, Solana. These Intents are broadcasted to the
          Solver Network that independently analyze and compete to execute the
          Intents through optimal pathways across supported blockchains.
        </p>

        <p>
          The Interfaces are designed to simplify blockchain interactions by
          allowing users, services, or AI agents to declare high-level outcomes
          they wish to achieve, rather than specifying the technical steps
          required.
        </p>

        <p>
          The Interfaces revolve around the concept of &ldquo;intents,&rdquo;
          which are structured declarations containing key details such as the
          initiator&rsquo;s NEAR account ID, the type of intent (e.g., token
          swap, transfer), source assets and amounts, desired outcomes, unique
          identifiers for tracking, and optional constraints like deadlines or
          minimum outputs. These intents are broadcasted to a Solver Network,
          where Solvers analyze and compete to provide an execution plan. Once a
          user approves a Solver&rsquo;s quote, the Intent is executed via a
          smart contract on NEAR (intents.near) (being the Protocol), which
          handles the transaction - including cross-chain operations if
          necessary - while ensuring state changes are verified and reported
          back to the originator. This abstraction streamlines complex
          blockchain processes into an intuitive and efficient user experience.
        </p>

        <p>
          The Interfaces are distinct from the Protocol and are one, but not the
          exclusive, means of accessing the Protocol.{" "}
          <strong>
            The Company does not control or operate any version of the Protocol
            on any Blockchain Network.
          </strong>
        </p>

        <p>
          By using the Interfaces, you understand that you are not buying or
          selling digital assets from us and that we do not operate any
          liquidity pools on the Protocol or control trade execution on the
          Protocol. When users pay fees for trades, and/or any Slippage, those
          fees may accrue to Solvers, Liquidity Providers and Relayers for the
          Protocol. As a general matter, Solvers, Liquidity providers and
          Relayers are independent third parties. We may charge an Interface Fee
          (as described below in clause 2.2).
        </p>

        <p>
          The Protocol is maintained via a multi-signature governance mechanism
          involving multiple independent participants. Participation in this
          governance does not create any duty or obligation to users. No
          individual participant can unilaterally upgrade or otherwise control
          the Protocol. The Company is not the operator of the Protocol.
        </p>

        <p>
          As the Protocol is deployed on the NEAR Protocol, it is integrated
          with the Third-Party Bridges to enable cross-chain functionality. The
          Third-Party Bridges facilitate asset transfers between NEAR and
          supported networks (including, by way of example, Bitcoin, Ethereum,
          Arbitrum, Base, Solana and others). This allows non-NEAR-native assets
          to be bridged onto NEAR for settlement by the Protocol, and assets to
          be withdrawn from NEAR to a non-NEAR destination chain
          post-settlement.
        </p>

        <p>
          The Third-Party Bridges are integrated with, but are not part of, the
          Protocol. They are operated by independent third parties, not the
          Company. Your relationship with any Third-Party Bridge operator is
          governed by the applicable terms of service of that operator. We do
          not have custody or control over any Third-Party Bridge. You are
          solely responsible for evaluating and accepting the risks of using any
          Third-Party Bridge, including risks of software vulnerabilities,
          governance failures, hacks, or loss of assets.
        </p>

        <p>
          In addition, the 1Click Service is a separate service that provides a
          simplified user experience for interacting with the Protocol. The
          1Click Service handles routing of intents, bridging, and settlement
          steps in a streamlined fashion, abstracting away the technical steps
          from the user.
        </p>

        <p>
          The 1Click Service is an integration with the Protocol but is not
          itself part of the Protocol or the Interfaces, and it is not operated
          by the Company. It is operated by third parties. Your use of the
          1Click Service may be subject to its own terms of service and risks.
          We do not have custody or control over the 1Click Service. You are
          solely responsible for evaluating and accepting the risks of using the
          1Click Service, including any risks of downtime, misconfiguration, or
          loss of assets.
        </p>

        <p>
          To access the Interfaces, you must use a non-custodial wallet
          software, which allows you to interact with public blockchains. Your
          relationship with that non-custodial wallet provider is governed by
          the applicable terms of service of that wallet provider. We do not
          have custody or control over the contents of your wallet and have no
          ability to retrieve or transfer its contents. By connecting your
          wallet to the Interfaces, you agree to be bound by this Agreement and
          all of the terms incorporated herein by reference.
        </p>

        <p>Solvers are independent actors, and Company does not:</p>

        <p>(a) Guarantee optimal pricing or execution;</p>

        <p>(b) Assess Solvers&rsquo; reliability or security;</p>

        <p>
          (c) Insure against losses from Solver errors, collusion, or malicious
          acts.
        </p>

        <p>
          The Solver Network includes AI-driven, algorithmic-driven and
          human-operated Solvers. AI Solvers may exhibit limitations including
          algorithmic biases, unpredictable behaviors under certain conditions,
          or optimization approaches that prioritize different factors than you
          might expect. The Company does not develop, control, or validate the
          decision-making processes of individual Solvers and assumes no
          responsibility for their performance or outcomes.
        </p>

        <p>
          To the extent that you elect to conduct transactions in connection
          with the Interfaces, all transactions are conducted between you and
          the relevant third party (Solver Network) and the Company is not a
          party to them. The Company is not responsible for the quality, safety,
          accuracy, or any aspect of the transaction (regardless of whether such
          transaction is made available by the Interfaces) save where expressly
          indicated.
        </p>

        <h3>2.1 Interface Fee</h3>

        <p>
          <strong>Interface Fee:</strong> In consideration for providing,
          operating, and improving the Interfaces, we may charge a fee on
          certain transactions routed through the Interfaces (the &ldquo;
          <strong>Interface Fee</strong>&rdquo;). The applicability, amount, or
          rate of any Interface Fee may vary depending on transaction type or
          other factors and may change from time to time at our discretion. The
          Interface Fee applies solely to use of the Interfaces and does not
          alter or affect execution of the Protocol. The applicable Interface
          Fee will be clearly disclosed through the Interface at or before the
          time you authorise a transaction. You are solely responsible for
          paying any Interface Fee associated with your transactions. Interface
          Fees are generally non-refundable once a transaction is submitted and
          may not be refundable if a transaction fails, is reverted, or does not
          complete as expected, except where required by applicable law.
        </p>

        <p>
          <strong>Protocol and Solver Fees:</strong> Transactions routed through
          Protocol may also be subject to additional protocol-level charges,
          including (i) solver incentives, (ii) protocol fees, (iii) liquidity
          pool or liquidity provider (LP) fees, and (iv) any other
          protocol-level or execution-related fees. These fees are not retained
          by us and form part of the protocol-driven execution costs.
        </p>

        <p>
          <strong>Gas / Network Fees:</strong> All blockchain transactions
          require network transaction fees (e.g., &ldquo;gas&rdquo;) paid to the
          applicable network. You are solely responsible for gas and related
          network costs. Gas is set by the network and is non-refundable,
          including for transactions that fail or are reverted by the network or
          smart contract.
        </p>

        <p>
          <strong>Slippage:</strong> Where the Interface presents a
          pre-transaction summary, it will show the estimated total amount
          payable or receivable, inclusive of all applicable Interface Fees,
          protocol fees, solver fees, and other execution-related fees, but{" "}
          <strong>exclusive of slippage</strong>. You acknowledge and agree that
          the final execution price may differ from the pre-transaction quote
          due to market conditions and slippage (whether higher or lower). You
          accept full responsibility for any slippage and acknowledge that
          neither we nor the Interface can guarantee execution at the quoted
          price.
        </p>

        <p>
          <strong>Third-Party Fees:</strong> Your use of third-party services
          (aggregators, bridges, wallets, payment processors, custodians) may be
          subject to their separate fees, spreads, and terms. You are
          responsible for all such amounts; we do not control those fees.
        </p>

        <p>
          <strong>Changes to Fees:</strong> We may change, add, discount,
          suspend, or waive the Interface Fee prospectively at any time. Where a
          pre-transaction summary is shown, changes will apply to transactions
          authorized after the change is effective; you will see the applicable
          Interface Fee at preview/confirmation. We may also run promotions
          (including zero-fee or reduced-fee offers) from time to time.
        </p>

        <p>
          <strong>Taxes:</strong> You are solely responsible for determining and
          paying any taxes (including VAT/GST, sales, use, income, or similar)
          arising from your use of the Interfaces or any transactions you
          initiate.
        </p>

        <p>
          <strong>No Fee-Avoidance:</strong> You agree not to circumvent,
          disable, or interfere with any fee-calculation, metering, or
          collection mechanism of the Interfaces (for example, by spoofing
          requests, replaying signatures, or using unauthorized tools to strip
          or divert the Interface Fee). We may limit, suspend, or terminate
          access for fee-avoidance or attempted evasion.
        </p>

        <p>
          <strong>Rounding and Minimums:</strong> For operational reasons, we
          may apply rounding to the nearest display unit supported by the
          relevant token or network and set minimum fee amounts; any such rules
          will be reflected in the quote or post-trade details where applicable.
          (This section does not affect your separate obligation to pay network
          gas.)
        </p>

        <h3>2.2 Third Party Services and Content</h3>

        <p>
          When you use any of the Interfaces, you may also be using the
          interfaces, services or content of one or more third parties. Your use
          of such third party interfaces, services or content may be subject to
          separate policies, terms of use and fees of these third parties, and
          you agree to abide by and be responsible for such policies, terms of
          use and fees, as applicable.
        </p>

        <h3>2.3 Other Interfaces</h3>

        <p>
          We may from time to time in the future offer additional Interfaces or
          products, and such additional Interfaces shall be considered a product
          as used herein, regardless of whether such product is specifically
          defined in this Agreement.
        </p>

        <h2>3. Eligibility</h2>

        <p>
          Our Interface is <strong>NOT</strong> offered to persons or entities
          who reside in, are citizens of, are incorporated in, or have a
          registered office in any Prohibited Localities, namely Restricted
          Persons, as defined below. We do not make exceptions. If you are a
          Restricted Person, then do not attempt to access or use the Interface.
          Use of a virtual private network (e.g., a VPN) or other means by
          Restricted Persons to access or use the Interface is prohibited. If
          you use the Interface you state that you (a) are at least 18; (b) are
          not acting in contravention of the laws of your jurisdiction by using
          the Interface; (c) are not located, established or registered in any
          of the jurisdictions enlisted below titled &ldquo;
          <strong>Prohibited Localities</strong>&rdquo;, and (d) are not a
          &ldquo;<strong>Restricted Person</strong>&rdquo; as defined below.
        </p>

        <p>
          <strong>General.</strong> You may not use the Interface if you are
          otherwise barred from using the Interface under applicable law.
        </p>

        <p>
          <strong>Legality.</strong> You are solely responsible for adhering to
          all laws and regulations applicable to you and your use or access to
          the Interface. Your use of the Interface is prohibited by and
          otherwise violate or facilitate the violation of any applicable laws
          or regulations, or contribute to or facilitate any illegal activity.
        </p>

        <p>
          By using or accessing the Interface, you represent to us that you are
          not subject to the Sanction Lists and you are not a Restricted Person,
          as defined below.
        </p>

        <p>
          <strong>&ldquo;Sanction Lists&rdquo;</strong> means any sanctions
          designations listed on economic/trade embargo lists and/or specially
          designated persons/blocked persons lists published by the
          international organisations, as well as any state and governmental
          authorities of any jurisdiction, including, but not limited to the
          lists of United Nations, European Union and its Member States, United
          States and United Kingdom sanctions lists.
        </p>

        <p>
          We make no representations or warranties that the information,
          products, or services provided through our Interface, are appropriate
          for access or use in other jurisdictions. You are not permitted to
          access or use our Interface in any jurisdiction or country if it would
          be contrary to the law or regulation of that jurisdiction or if it
          would subject us to the laws of, or any registration requirement with,
          such jurisdiction.
        </p>

        <p>
          We reserve the right to limit the availability of our Interface to any
          person, geographic area, or jurisdiction, at any time and at our sole
          and absolute discretion.
        </p>

        <p>
          <strong>Prohibited Localities.</strong> We do not interact with
          digital wallets or users located in, established in, or a resident of
          Afghanistan, Belarus, Central African Republic, Cuba, Democratic
          Republic of Congo, Guinea-Bissau, Haiti, Iran, Libya, Mali, Myanmar
          (Burma), Nicaragua, North Korea (DPRK), Russia, the Crimea, Donetsk,
          Luhansk, Zaporizhzhia, and Kherson regions of Ukraine, Somalia, South
          Sudan, Sudan, Syria, Venezuela (including certain SDNs connected with
          the Maduro regime), Yemen, or Zimbabwe or any other state, country or
          region that is included in the Sanction Lists.
        </p>

        <p>
          You must not use any software or networking techniques, including use
          of a Virtual Private Network (VPN) to modify your internet protocol
          address or otherwise circumvent or attempt to circumvent this
          prohibition.
        </p>

        <p>
          <strong>Restricted Persons.</strong> We do not interact with digital
          wallets or users, which have been previously classified or otherwise
          identified by international organizations or any state and
          governmental authorities of any jurisdiction, as belonging or
          affiliated with the persons specially designated or otherwise included
          in the Sanction Lists (&ldquo;<strong>Restricted Persons</strong>
          &rdquo;). For the purposes of these Terms, Restricted Persons shall
          also include all persons or entities who reside in, are citizens of,
          are incorporated in, or have a registered office in the Prohibited
          Localities.
        </p>

        <p>
          <strong>UK Residents.</strong> If you are a UK resident, you agree and
          acknowledge that the Interfaces are provided as a tool for users to
          interact with the Protocol on their own initiative, with no
          endorsement or recommendation of cryptocurrency trading activities. In
          doing so, the Company is not recommending that users or potential
          users engage in cryptoasset trading activity, and users or potential
          users of the Interfaces should not regard the Interfaces as involving
          any form of recommendation, invitation or inducement to deal in
          cryptoassets.
        </p>

        <p>
          <strong>Third-Party Restrictions.</strong> As mentioned above, our
          Interface may include the third-party services. Your interaction with
          and use of the third-party services is governed by the respective
          terms and conditions of the third-party providers, including but not
          limited to their eligibility requirements, restrictions on certain
          localities, restricted persons or any other eligibility-related terms.
          As a result, based on those terms set by the third-party providers,
          your access to certain products and/or features of the Interface may
          be restricted by those providers. Please note that we only facilitate
          your interaction with these third-party services and we bear no
          liability for any such restrictions thereof. It is your own
          responsibility to review those terms and conditions, and ensure that
          you meet the requirements set forth therein.
        </p>

        <p>
          <strong>Non-Circumvention.</strong> You agree not to access the
          Interface using any technology for the purposes of circumventing these
          Terms.
        </p>

        <h2>4. Modifications of this Agreement or the Interfaces</h2>

        <h3>4.1 Modifications of this Agreement</h3>

        <p>
          We reserve the right, in our sole discretion, to modify this Agreement
          from time to time. If we make any material modifications, we will
          notify you by updating the date at the top of the Agreement and by
          maintaining a current version of the Agreement at the website.
        </p>

        <p>
          All modifications will be effective when they are posted, and your
          continued accessing or use of any of the Interfaces will serve as
          confirmation of your acceptance of those modifications. If you do not
          agree with any modifications to this Agreement, you must immediately
          stop accessing and using all of the Interfaces.
        </p>

        <h3>4.2 Modifications of the Interfaces</h3>

        <p>
          We reserve the following rights, which do not constitute obligations
          of ours: (a) with or without notice to you, to modify, substitute,
          eliminate, restrict or add to any of the Interfaces; (b) to review,
          modify, filter, disable, delete and remove any and all content and
          information from any of the Interfaces; (c) to disable or modify
          access to access to the Interfaces at any time in the event of any
          breach of these Terms. You acknowledge, understand, and agree that,
          from time to time, the Interfaces may be inaccessible or inoperable
          for any reason, including: (a) equipment or technology or other
          infrastructure delay, inaccessibility, or malfunctions; (b) periodic
          maintenance procedures or repairs that Company or any of our suppliers
          or contractors may undertake from time to time; (c) causes beyond
          Company&rsquo;s control or that Company could not reasonably foresee;
          (d) disruptions and temporary or permanent unavailability of
          underlying blockchain infrastructure; or (e) unavailability of
          third-party service providers or external partners for any reason.
        </p>

        <p>
          Without limitation of any other provision of these Terms, and as set
          forth below, Company has no responsibility or liability for any losses
          or other injuries resulting from any such events.
        </p>

        <p>
          The Protocol may undergo changes, updates, or modifications through
          technical upgrades, community governance decisions, or other processes
          outside the Company&rsquo;s control. Such changes could affect
          functionality, compatibility, or availability of features accessible
          through the Interfaces, and the Company provides no guarantee of
          continued compatibility between the Interfaces and all Protocol
          versions. You acknowledge that certain changes to the Protocol may
          require corresponding updates to the Interfaces or significantly alter
          the user experience, and accept this as an inherent risk of
          interacting with evolving blockchain technology.
        </p>

        <h2>5. Intellectual Property Rights</h2>

        <h3>5.1 IP Rights Generally</h3>

        <p>
          As between you and us, the Interfaces and their proprietary elements,
          including, but not limited to, software, text, images, trademarks,
          service marks, copyrights, patents, and designs, other than
          open-source components, are owned by our licensors and are licensed to
          us. Accessing or using our Interfaces do not grant you any proprietary
          intellectual property or other rights in our Interfaces or their
          contents.
        </p>

        <p>
          While the software code powering the Interfaces is open-source and
          available under the MIT License (accessible here:{" "}
          <a
            href="https://github.com/defuse-protocol/defuse-frontend"
            target="_blank"
            rel="noreferrer noopener"
          >
            https://github.com/defuse-protocol/defuse-frontend
          </a>
          ), the IP Owners retain all intellectual property rights in and to the
          Interfaces, including (without limitation) the software code, visual
          design, trademarks, logos, and any other branding, design features, or
          content. Users may fork and modify the open-source code in accordance
          with the MIT License, but may not use the Company&rsquo;s trademarks
          or branding in derivative works without permission. Your use of the
          hosted Interfaces provided by the Company is governed by these Terms,
          while any independent deployment of the open-source code is governed
          by the applicable open-source license. You will retain ownership of
          all intellectual property and other rights in any information and
          materials you submit through the Interface. However, by uploading such
          information or materials, you grant us a worldwide, royalty-free,
          irrevocable license to use, copy, distribute, publish and send this
          data in any manner in accordance with applicable laws and regulations.
        </p>

        <p>
          You agree that you will not use, modify, distribute, tamper with,
          reverse engineer, disassemble or decompile any of the Interfaces for
          any purpose other than as expressly permitted pursuant to this
          Agreement. Except as set forth in this Agreement, we grant you no
          right, title or interest in or to any of the Interfaces, including any
          intellectual property rights. You understand and acknowledge that the
          Protocol is not an Interface and we do not own, control, or operate,
          the Protocol, 1CS, or any Third-Party Bridge.
        </p>

        <p>
          If (i) you satisfy all of the eligibility requirements set forth in
          the Terms, and (ii) your access to and use of the Interface complies
          with the Terms, you hereby are granted a single, personal, limited
          license to access and use the Interface. This license is
          non-exclusive, non-transferable, and freely revocable by us at any
          time without notice or cause in our sole discretion. Use of the
          Interface for any purpose not expressly permitted by the Terms is
          strictly prohibited. Unlike the Interface, the Protocol is composed
          entirely of open-source software running on the NEAR Protocol and is
          not our proprietary property. The Protocol may also run on the other
          blockchains to which the same clause applies.
        </p>

        <h3>5.2 Third-Party Resources and Promotions</h3>

        <p>
          The Interfaces may contain references or links to third-party
          resources, including, but not limited to, information, materials,
          products, or services, that we do not own or control. In addition,
          third parties may offer promotions related to your access and use of
          the Interfaces. We do not approve, monitor, or endorse, and we do not
          assume any responsibility for, any such resources or promotions. If
          you access any such resources or participate in any such promotions,
          you do so at your own risk, and you understand that this Agreement
          does not apply to your dealings or relationships with any third
          parties. You expressly relieve us of any and all liability arising
          from your use of any such resources or participation in any such
          promotions, and you shall not use the Interfaces in combination with
          any third party products or services in any manner that would infringe
          or otherwise violate the intellectual property rights of any third
          party or violate any applicable law.
        </p>

        <h3>5.3 Additional Rights</h3>

        <p>
          We reserve the right to cooperate with any law enforcement, court or
          government investigation or order or third party requesting or
          directing that we disclose information or content or information that
          you provide.
        </p>

        <h2>6. Your Responsibilities</h2>

        <h3>6.1 Prohibited Activity</h3>

        <p>
          You agree not to engage in, or attempt to engage in, any of the
          following categories of prohibited activity in relation to your access
          and use of the Interfaces:
        </p>

        <p>
          1) <strong>Intellectual Property Infringement.</strong> Activity that
          infringes on or violates any copyright, trademark, service mark,
          patent, right of publicity, right of privacy, or other proprietary or
          intellectual property rights under applicable law in any jurisdiction
          in the world.
        </p>

        <p>
          2) <strong>Data Privacy.</strong> Activity that violates any
          applicable laws, and contractual and fiduciary obligations relating to
          the collection, storage, use, transfer and any other processing of any
          personal information or any other sensitive or confidential
          information.
        </p>

        <p>
          3) <strong>Cyberattack.</strong> Activity that seeks to interfere with
          or compromise the integrity, security, or proper functioning of any
          computer, server, network, personal device, or other information
          technology system, including, but not limited to, the deployment of
          viruses and denial of service attacks. Activity that uses any robot,
          spider, crawler, scraper or other automated means or interface not
          provided by us to access the Interfaces to introduce any malware,
          virus, Trojan horse, worm, logic bomb, drop-dead device, backdoor,
          shutdown mechanism or other harmful material into the Interface or the
          Interfaces.
        </p>

        <p>
          4) <strong>Fraud and Misrepresentation.</strong> Activity that seeks
          to defraud us or any other person or entity, including, but not
          limited to, providing any false, inaccurate, or misleading information
          in order to unlawfully obtain the property of another, or to defraud
          Company, other users of the Interfaces or any other person.
        </p>

        <p>
          5) <strong>Market Manipulation.</strong> Activity that violates any
          applicable law, rule, or regulation concerning the integrity of
          trading markets, including, but not limited to: the manipulative
          tactics commonly known as &ldquo;rug pulls&rdquo;; pumping and
          dumping; wash trading; front-running; accommodation trading;
          fictitious transactions; pre-arranged or non-competitive transactions;
          cornering or attempting cornering of digital assets; violations of
          bids or offers; spoofing; knowingly making any bid or offer for the
          purpose of making a market price that does not reflect the true state
          of the market; entering orders for the purpose of entering into
          transactions without a net change in either party&rsquo;s open
          positions but a resulting profit to one party and a loss to the other
          party, commonly known as a &ldquo;money pass&rdquo;; any other
          manipulation or fraudulent act or scheme to defraud, deceive, trick or
          mislead; or any other trading activity that, in the reasonable
          judgment of Company, is abusive, improper or disruptive to the
          operation of the Interfaces.
        </p>

        <p>
          6) <strong>Securities and Derivatives Violations.</strong> Activity
          that violates any applicable law, rule, or regulation concerning the
          trading of securities or derivatives, including, but not limited to,
          the unregistered offering of securities and the offering of leveraged
          and margined commodity products to retail customers in the United
          States.
        </p>

        <p>
          7) <strong>Sale of Stolen Property.</strong> Buying, selling, or
          transferring of stolen items, fraudulently obtained items, items taken
          without authorization, and/or any other illegally obtained items.
          Using or accessing the Interfaces to transmit or exchange digital
          assets that are the direct or indirect proceeds of any criminal or
          fraudulent activity, including terrorism or tax evasion.
        </p>

        <p>
          8) <strong>Data Mining or Scraping.</strong> Activity that involves
          data mining, robots, scraping, or similar data gathering or extraction
          methods of content or information from any of the Interfaces.
        </p>

        <p>
          9) <strong>Objectionable Content.</strong> Activity that involves
          soliciting information from anyone under the age of 18 or that is
          otherwise harmful, threatening, abusive, harassing, tortious,
          excessively violent, defamatory, vulgar, obscene, pornographic,
          libelous, invasive of another&rsquo;s privacy, hateful,
          discriminatory, or otherwise objectionable.
        </p>

        <p>
          10) <strong>Disruptive Content.</strong> Activity that could interfere
          with, disrupt, negatively affect, or inhibit other users from fully
          enjoying the Interfaces, or that could damage, disable, overburden, or
          impair the functioning of the Interfaces in any manner.
        </p>

        <p>
          11) <strong>Intent Manipulation:</strong> Submitting Intents with
          falsified parameters, spam, or economically unfeasible constraints.
        </p>

        <p>
          12) <strong>Solver Abuse:</strong> Interfering with Solver operations
          (e.g., front-running, quote spamming).
        </p>

        <p>
          13) <strong>Cross-Chain Exploits:</strong> Leveraging settlement
          delays or bridge vulnerabilities for arbitrage.
        </p>

        <p>
          As a further condition to accessing or using the Interfaces, you
          affirm that you will only transfer legally-obtained digital assets
          that belong to you and that any digital assets you use in connection
          with the Interfaces are either owned by you or you are validly
          authorized to carry out actions using such digital assets.
        </p>

        <h3>6.2 Trading &ldquo;Swaps&rdquo;</h3>

        <p>
          You agree and understand that: (a) all trades you submit through any
          of the Interfaces are considered unsolicited, which means that they
          are solely initiated by you; (b) you have not received any investment
          advice from us in connection with any trades; and (c) you have not
          obtained any service or contractual commitment from any participant of
          the Interfaces; and (d) with us we do not conduct a suitability review
          of any trades you submit.
        </p>

        <h3>6.3 Non-Custodial and No Fiduciary Duties</h3>

        <p>
          Each of the Interfaces is a purely non-custodial application, meaning
          we do not ever have custody, possession, or control of your digital
          assets at any time. It further means you are solely responsible for
          the custody of the cryptographic private keys to the digital asset
          wallets you hold and you should never share your wallet credentials or
          seed phrase with anyone. We accept no responsibility for, or liability
          to you, in connection with your use of a wallet and make no
          representations or warranties regarding how any of the Interfaces will
          operate with any specific wallet. The Company has no control over, or
          liability for, the delivery, quality, safety, legality, or any other
          aspect of any digital assets that you may transfer to or from a third
          party, and we are not responsible for ensuring that an entity with
          whom you transact completes the transaction or is authorized to do so,
          and if you experience a problem with any transactions in digital
          assets using the Interfaces, then you bear the entire risk.
        </p>

        <p>
          Likewise, you are solely responsible for any associated wallet and we
          are not liable for any acts or omissions by you in connection with or
          as a result of your wallet being compromised. The Company does not act
          as an agent for you or any other user of the Interfaces and you are
          solely responsible for your use of the Interfaces, including all your
          transfers of digital assets.
        </p>

        <p>
          This Agreement is not intended to, and does not, create or impose any
          fiduciary duties on us. To the fullest extent permitted by law, you
          acknowledge and agree that we owe no fiduciary duties or liabilities
          to you or any other party, and that to the extent any such duties or
          liabilities may exist at law or in equity, those duties and
          liabilities are hereby irrevocably disclaimed, waived, and eliminated.
          You further agree that the only duties and obligations that we owe you
          are those set out expressly in this Agreement.
        </p>

        <p>
          By using the Interfaces, you acknowledge and accept that we make no
          representations regarding how any authority may characterize the
          Interfaces or related activities under applicable laws or regulations.
          You bear the risk that authorities may take positions inconsistent
          with our view, and, to the maximum extent permitted by applicable law,
          you waive, release, and covenant not to sue the Company or any of its
          affiliates for any and all claims, losses or liabilities arising from
          or related to such positions or actions. You further acknowledge that
          the Company is not responsible for, and shall have no liability in
          connection with, any claims relating to such third-party services,
          their operators, or any such persons or entities.
        </p>

        <h3>6.4 Compliance and Tax Obligations</h3>

        <p>
          One or more of the Interfaces may not be available for use in your
          jurisdiction. By accessing or using any of the Interfaces, you agree
          that you are solely and entirely responsible for compliance with all
          laws and regulations that may apply to you. The cross-border nature of
          blockchain technology means transactions may implicate laws from
          multiple jurisdictions simultaneously. The Company makes no
          representations regarding the legality of the Protocol or Interfaces
          in any specific jurisdiction.
        </p>

        <p>
          Specifically, your use of the Interfaces or the Protocol may result in
          various tax consequences, such as income or capital gains tax,
          value-added tax, goods and services tax, or sales tax in certain
          jurisdictions. It is your responsibility to determine whether taxes
          apply to any transactions you initiate or receive and, if so, to
          report and/or remit the correct tax to the appropriate tax authority.
          It is recommended that you consult a tax professional to understand
          the tax implications of your transactions, as cryptocurrency and
          cross-chain transactions can be complex and vary by jurisdiction.
        </p>

        <p>
          You expressly agree that you assume all risks in connection with your
          access to and use of the Interface. Additionally, you expressly waive
          and release us from any and all liability, claims, causes of action,
          or damages arising from or in any way relating to your access to and
          use of the Interface. Your Compliance Obligations. The Interface may
          not be available or appropriate for use in all jurisdictions. By
          accessing or using the Interface, you agree that you are solely and
          entirely responsible for compliance with all laws and regulations that
          may apply to you. You further agree that we have no obligation to
          inform you of any potential liabilities or violations of law or
          regulation that may arise in connection with your access and use of
          the Interface and that we are not liable in any respect for any
          failure by you to comply with any applicable laws or regulations.
        </p>

        <p>
          <strong>Compliance Assessment.</strong> The Company reserves the
          right, but has no obligation, to use publicly available and accessible
          information and engage third-party providers to monitor and assess
          your and/or other users&rsquo; wallet addresses, third-party links,
          domain names, virtual currencies, smart contracts, and any other
          content available via the Interface for the risks of money laundering,
          terrorism financing, fraud and/or any other illicit or non-compliant
          activities. No additional personal data is collected to perform such
          compliance assessment.
        </p>

        <h3>6.5 Gas Fees, Price Estimates, and Slippage</h3>

        <p>
          <strong>
            Blockchain transactions require the payment of transaction fees to
            the appropriate network (&ldquo;Gas Fees&rdquo;).
          </strong>{" "}
          Except as otherwise expressly set forth in the terms of another offer
          by the Company, you will be solely responsible to pay the Gas Fees for
          any transaction that you initiate via any of the Interfaces. Although
          we attempt to provide accurate fee information, this information
          reflects our estimates of fees, which may vary from the actual fees
          paid to use the Interfaces and interact with the NEAR, Bitcoin,
          Ethereum, Arbitrum, Base, Solana, and other blockchains.
        </p>

        <p>
          When executing trades through the Interfaces, you may experience
          Slippage &ndash; the difference between the quoted price and the
          execution price. Slippage may be more pronounced in cross-chain
          transactions where market conditions may change during the settlement
          period. You acknowledge that the final execution price may differ from
          the initially displayed quote, and that neither the Company nor the
          Protocol guarantees execution at the quoted price.
        </p>

        <h3>6.6 Release of Claims</h3>

        <p>
          You expressly agree that you assume all risks in connection with your
          access and use of any of the Interfaces. You further expressly waive
          and release us from any and all liability, claims, causes of action,
          or damages arising from or in any way relating to your use of any of
          the Interfaces. If you are a California resident, you waive the
          benefits and protections of California Civil Code &sect; 1542, which
          provides: &quot;[a] general release does not extend to claims that the
          creditor or releasing party does not know or suspect to exist in his
          or her favor at the time of executing the release and that, if known
          by him or her, would have materially affected his or her settlement
          with the debtor or released party.&quot;
        </p>

        <h2>7. Disclaimers</h2>

        <h3>7.1 Assumption of Risk &mdash; Generally</h3>

        <p>
          The Company does not operate the protocol nor a digital asset or
          derivatives exchange platform or offer trade execution or clearing
          services and has no oversight, involvement, or control concerning your
          transactions using the Interfaces. All transactions between users of
          the Interface are executed peer-to-peer directly between the
          users&rsquo; addresses through smart contracts and the Protocol. You
          are responsible for complying with all applicable laws that govern
          your digital assets.
        </p>

        <p>
          By accessing and using any of the Interfaces, you represent that you
          are financially and technically sophisticated enough to understand the
          inherent risks associated with using cryptographic and
          blockchain-based systems, and that you have a working knowledge of the
          usage and intricacies of digital assets such as NEAR (NEAR), Ether
          (ETH), Bitcoin (BTC), Solana (SOL), Arbitrum (ARB) and TON (this list
          is non-exhaustive), so-called stablecoins, and other digital tokens
          such as those following the Ethereum token standard (ERC-20) or any
          other token standard, including NEP-141, for example.
        </p>

        <p>
          You acknowledge and understand the inherent risks associated with
          cryptographic systems and blockchain-based networks. The Company does
          not own or control any of the underlying software through which
          blockchain networks are formed. In general, the software underlying
          blockchain networks, including the NEAR, Bitcoin, Ethereum, Arbitrum,
          Base, Solana, and TON blockchains (this list is non-exhaustive and
          includes any and all open-source blockchains), is open-source, such
          that anyone can use, copy, modify, and distribute it. By using the
          Interfaces, you acknowledge and agree (a) that the Company is not
          responsible for the operation of the blockchain-based software and
          networks underlying the Interfaces, (b) that there exists no guarantee
          of the functionality, security, or availability of that software and
          networks, and (c) that the underlying blockchain-based networks are
          subject to sudden changes in operating rules, such as those commonly
          referred to as &ldquo;forks,&rdquo; which may materially affect the
          Interfaces. Blockchain networks use public and private key
          cryptography. You alone are responsible for securing your private
          key(s). We do not have access to your private key(s). Losing control
          of your private key(s) will permanently and irreversibly deny you
          access to digital assets on the NEAR, Bitcoin, Ethereum, Arbitrum,
          Base, Solana, and TON blockchains or other blockchain-based networks.
          Neither the Company, the Protocol nor any other person or entity will
          be able to retrieve or protect your digital assets. If your private
          key(s) are lost, then you will not be able to transfer your digital
          assets to any other blockchain address or wallet. If this occurs, then
          you will not be able to realize any value or utility from the digital
          assets that you may hold.
        </p>

        <p>
          Further, you acknowledge and understand that the markets for these
          digital assets are nascent and highly volatile due to risk factors
          including, but not limited to, adoption, speculation, technology,
          security, and regulation. You understand that anyone can create a
          token, including fake versions of existing tokens and tokens that
          falsely claim to represent projects, and acknowledge and understand
          the risk that you may mistakenly trade those or other tokens.
          So-called stablecoins may not be as stable as they purport to be, may
          not be fully or adequately collateralized, and may be subject to
          panics and runs.
        </p>

        <p>
          The information displayed through the Interface and information about
          prices or other are provided by third parties and/or calculated for
          informational purposes and we do not provide any warranties for such
          information.
        </p>

        <p>
          Further, you acknowledge and understand that smart contract
          transactions automatically execute and settle, and that
          blockchain-based transactions are irreversible when confirmed. You
          acknowledge and understand that you are responsible for all trades you
          place, including any erroneous orders that may be filled. We do not
          take any action to resolve erroneous trades that result from your
          errors. You acknowledge and understand that the cost and speed of
          transacting with cryptographic and blockchain-based systems such as
          NEAR, Bitcoin, Ethereum, Arbitrum, Base, Solana, TON and others are
          variable and may increase dramatically at any time. You further
          acknowledge and understand the risk of selecting to trade in expert
          modes, which can expose you to potentially significant price slippage
          and higher costs.
        </p>

        <p>
          Further, you acknowledge and understand that the Interfaces and your
          digital assets could be impacted by one or more regulatory inquiries
          or regulatory actions, which could impede or limit the ability of the
          Company to continue to make available our proprietary software and
          could impede or limit your ability to access or use the Interfaces.
        </p>

        <p>
          Further, you acknowledge and understand that cryptography is a
          progressing field with advances in code cracking or other technical
          advancements, such as the development of quantum computers, which may
          present risks to digital assets and the Interfaces, and could result
          in the theft or loss of your digital assets. To the extent possible,
          the smart contracts available on the interface will be updated to
          account for any advances in cryptography and to incorporate additional
          security measures necessary to address risks presented from
          technological advancements, but that intention does not guarantee or
          otherwise ensure full security of the Interfaces.
        </p>

        <p>
          Further, you understand that NEAR, Bitcoin, Ethereum, Arbitrum, Base,
          Solana, TON and other blockchain-based networks remain under
          development, which creates technological and security risks when using
          the Interfaces in addition to uncertainty relating to digital assets
          and transactions therein. You acknowledge that the cost of transacting
          on the NEAR, Bitcoin, Ethereum, Arbitrum, Base, Solana, TON and other
          blockchain-based networks is variable and may increase at any time
          causing impact to any activities taking place on NEAR, Bitcoin,
          Ethereum, Arbitrum, Base, Solana, TON or other blockchain-based
          networks, which may result in price fluctuations or increased costs
          when using the Interfaces.
        </p>

        <p>
          Further, you acknowledge and understand that the Interfaces are
          subject to flaws and that you are solely responsible for evaluating
          any code provided relating to the Interfaces. This warning and other
          warnings that the Company provides in these terms are in no way
          evidence or represent an on-going duty to alert you to all of the
          potential risks of utilizing the Interfaces. Although we intend to
          provide accurate and timely information and data, information
          available when using the Interfaces may not always be entirely
          accurate, complete, or current and may also include technical
          inaccuracies or typographical errors. To continue to provide you with
          as complete and accurate information as possible, information may be
          changed or updated from time to time without notice, including
          information regarding our policies. Accordingly, you acknowledge and
          understand that you should verify all information before relying on
          it, and all decisions based on information listed on the Interfaces
          are your sole responsibility. No representation is made as to the
          accuracy, completeness, or appropriateness for any particular purpose
          of any pricing information distributed via the site or otherwise when
          using the Interfaces. Prices and pricing information may be higher or
          lower than prices available on platforms providing similar services.
        </p>

        <p>
          We must comply with applicable laws, which may require us to, upon
          request by government agencies, take certain actions or provide
          information. You acknowledge and understand that the Company may in
          its sole discretion take any action it deems appropriate to cooperate
          with government agencies or comply with applicable laws.
        </p>

        <p>
          The users acknowledge that transactions executed through the
          Interfaces may experience Slippage, resulting in a final execution
          price different from the initially displayed price. Slippage is
          inherent to cross chain transactions due to factors such as market
          volatility, liquidity fluctuations, and blockchain transaction delays.
          The Company and the Protocol do not control or influence the price at
          which transactions are executed and are not responsible for any
          financial losses resulting from slippage.
        </p>

        <p>
          Furthermore, the Interfaces, by providing access to the Protocol,
          facilitate cross-chain transactions through Third-Party Bridges which
          are integrated with, but separate to, the Protocol. These Third-Party
          Bridges carry inherent risks, including but not limited to smart
          contract vulnerabilities, governance risks, and the potential for
          asset loss due to bridge failures or exploits. In particular, the Omni
          Bridge and HOT Bridge leverage Chain Signatures, which depend on
          cryptographic assumptions vulnerable to technological advances (e.g.,
          quantum computing). Compromised signatures may result in irreversible
          asset loss. The company does not control any of the Third-Party
          Bridges or Chain Signatures and disclaims any liability for any losses
          or damages resulting from their respective use.
        </p>

        <p>
          In summary, you acknowledge that We are not responsible for any of
          these variables or risks, do not own or control the Protocol, the
          1ClickService, or the Third-Party Bridges, and cannot be held liable
          for any resulting losses that you experience while accessing or using
          any of the Interfaces. Accordingly, you understand and agree to assume
          full responsibility for all of the risks of accessing and using the
          Interfaces to interact with the Protocol. You hereby irrevocably
          waive, release and discharge all claims, whether known or unknown to
          you, against the Company and Our shareholders, members, directors,
          officers, employees, agents, and representatives, suppliers, and
          contractors related to any of the risks set forth in this Section 7 or
          elsewhere in these terms.
        </p>

        <h3>7.2 No Warranties</h3>

        <p>
          Each of the Interfaces are provided on an &quot;as is&quot; and
          &quot;as available&quot; basis. To the fullest extent permitted by
          law, We disclaim any representations and warranties of any kind,
          whether express, implied, or statutory, including, but not limited to,
          the warranties of merchantability and fitness for a particular
          purpose. You acknowledge and understand that your use of each
          Interface is at your own risk. We do not represent or warrant that
          access to any of the Interfaces will be continuous, uninterrupted,
          timely, or secure; that the information contained in any of the
          Interfaces will be accurate, reliable, complete, or current; or that
          any of the Interfaces will be free from errors, defects, viruses, or
          other harmful elements, or that use of the Interfaces does not and
          will not infringe or otherwise violate the intellectual property of
          any third party. No advice, information, or statement that we make
          should be treated as creating any warranty concerning any of the
          Interfaces. We do not endorse, guarantee, or assume responsibility for
          any advertisements, offers, or statements made by third parties
          concerning any of the Interfaces.
        </p>

        <p>
          Similarly, the Protocol is provided &quot;as is&quot;, at your own
          risk, and without warranties of any kind. We do not provide, own, or
          control the Protocol. We do not accept any liability for any claims or
          damages whatsoever associated with your use, inability to use, or your
          interaction with other users of, the Protocol, including any direct,
          indirect, incidental, special, exemplary, punitive or consequential
          damages, or loss of profits, cryptocurrencies, tokens, or anything
          else of value. We do not endorse, guarantee, or assume responsibility
          for any advertisements, offers, or statements made by third parties
          concerning any of the Interfaces.
        </p>

        <p>
          You acknowledge and understand that data you provide while accessing
          or using the Interfaces may become irretrievably lost or corrupted or
          temporarily unavailable due to a variety of causes, and agree that, to
          the maximum extent permitted under applicable law, we will not be
          liable for any loss or damage caused by denial-of-service attacks,
          software failures, viruses or other technologically harmful materials
          (including those which may infect your computer equipment), protocol
          changes by third-party providers, internet outages, force majeure
          events or other disasters, scheduled or unscheduled maintenance, or
          other causes either within or outside of our control.
        </p>

        <p>
          By accessing and using the Interface, you represent that you
          understand (a) the Interface facilitates access to the Protocol, the
          use of which has many inherent risks, and (b) the cryptographic and
          blockchain-based systems have inherent risks to which you are exposed
          when using the Interface. You further represent that you have a
          working knowledge of the usage and intricacies of blockchain-based
          digital assets, including, without limitation, ERC-20 token standard
          available on the Ethereum, Ethereum layer 2 solutions or other
          blockchain networks. You further understand that the markets for these
          blockchain-based digital assets are highly volatile due to factors
          that include, but are not limited to, adoption, speculation,
          technology, security, and regulation. You acknowledge that the cost
          and speed of transacting with blockchain-based systems, such as
          Ethereum, are variable and may increase or decrease, respectively,
          drastically at any time. You hereby acknowledge and agree that we are
          not responsible for any of these variables or risks associated with
          the Protocol and cannot be held liable for any resulting losses that
          you experience while accessing or using the Interface. Accordingly,
          you understand and agree to assume full responsibility for all of the
          risks of accessing and using the Interface to interact with the
          Protocol.
        </p>

        <p>
          Any payments or financial transactions that you engage in will be
          processed via automated smart contracts. Once initiated, we have no
          control over these payments or transactions, nor do we have the
          ability to reverse any payments or transactions.
        </p>

        <h3>7.3 No Investment Advice</h3>

        <p>
          All information provided by any of the Interfaces is for informational
          purposes only and should not be construed as investment advice or a
          recommendation that a particular token is a safe or sound investment.
          You should not take, or refrain from taking, any action based on any
          information contained in any of the Interfaces. By providing token
          information for your convenience, we do not make any trading,
          financial or investment recommendations to you or opine on the merits
          of any transaction or opportunity. You alone are responsible for
          determining whether any trading is appropriate for you based on your
          personal investment objectives, financial circumstances, and risk
          tolerance. You should seek professional advice before submitting a
          transaction.
        </p>

        <h2>8. Indemnification</h2>

        <p>
          You agree to hold harmless, release, defend, and indemnify us and our
          officers, directors, employees, contractors, agents, affiliates, and
          subsidiaries (collectively &ldquo;<strong>Indemnified Parties</strong>
          &rdquo;) from and against all claims, damages, obligations, losses,
          liabilities, costs, and expenses arising from: (a) your access and use
          of any of the Interfaces; (b) your violation of any term or condition
          of this Agreement, the right of any third party, or any other
          applicable law, rule, or regulation; (c) any other party&#39;s access
          and use of any of the Interfaces with your assistance or using any
          device or account that you own or control; (d) digital assets
          associated with your wallet; (e) your infringement, misappropriation,
          or other violation of the intellectual property or other proprietary
          rights of any other person or entity; and (f) any dispute between you
          and (i) any other user of any of the Interfaces or (ii) any of your
          own customers or users. If you are obligated to indemnify any
          Indemnified Party, the Company (or, at our sole discretion, the
          applicable Indemnified Party) will have the right, in our or its sole
          discretion, to control any action or proceeding and to determine
          whether the Company wishes to settle, and if so, on what terms, and
          you agree to cooperate with the Company in the defense.
        </p>

        <h2>9. Limitation of Damages and Liability</h2>

        <p>
          To the maximum extent permitted by applicable law, under no
          circumstances shall We or any of our officers, directors, employees,
          contractors, agents, affiliates, or subsidiaries be liable to you for
          any indirect, punitive, incidental, special, consequential, or
          exemplary damages, including, but not limited to, damages for loss of
          profits, goodwill, use, data, fiat, revenue, opportunities, or other
          intangible property, arising out of or relating to any access or use
          of or inability to access or use any of the Interfaces, the Protocol,
          the 1Click Service, or any Third-Party Bridge, nor will we be
          responsible for any damage, loss, or injury resulting from hacking,
          tampering, or other unauthorized access or use of any of the
          Interfaces, the Protocol, the 1Click Service, or any Third-Party
          Bridge, or any information contained within any of the foregoing,
          whether such damages are based in contract, tort, negligence, strict
          liability, or otherwise, even if an authorized representative of the
          Company has been advised of or knew or should have known of the
          possibility of such damages. We assume no liability or responsibility
          for any: (a) errors, mistakes, or inaccuracies of content; (b)
          personal injury or property damage, of any nature whatsoever,
          resulting from any access or use of the Interfaces; (c) unauthorized
          access or use of any secure server or database in our control, or the
          use of any information or data stored therein; (d) interruption or
          cessation of function related to any of the Interfaces; (e) bugs,
          viruses, trojan horses, or the like that may be transmitted to or
          through the Interfaces; (f) errors or omissions in, or loss or damage
          incurred as a result of the use of, any content made available through
          any of the Interfaces; (g) the defamatory, offensive, or illegal
          conduct of any third party and (h) causes beyond Company&rsquo;s
          control or that the Company could not reasonably foresee.
        </p>

        <p>
          We have no liability to you or to any third party for any claims or
          damages that may arise as a result of any payments or transactions
          that you engage in via any of the Interfaces, or any other payment or
          transactions that you conduct via any of the Interfaces. Except as
          expressly provided for herein, we do not provide refunds for any
          purchases that you might make on or through any of the Interfaces.
        </p>

        <p>
          We make no warranties or representations, express or implied, about
          linked third party services, the third parties they are owned and
          operated by, the information contained on them, assets available
          through them, or the suitability, privacy, or security of their
          Interfaces or services. You acknowledge sole responsibility for and
          assume all risk arising from your use of third-party services,
          third-party websites, applications, or resources. We shall not be
          liable under any circumstances for damages arising out of or in any
          way related to software, Interfaces, services, and/or information
          offered or provided by third-parties and accessed through any of the
          Interfaces.
        </p>

        <p>
          Nothing in these Terms excludes or limits liability that cannot be
          excluded or limited under applicable law, including liability for
          fraud, wilful misconduct, or death or personal injury caused by
          negligence. In such cases, our liability is limited to the minimum
          extent required by law. Subject to the foregoing, in no event shall
          our total aggregate liability to you for all damages arising out of or
          relating to these Terms exceed one hundred U.S. dollars (USD 100) or
          its equivalent in the local currency of the applicable jurisdiction.
        </p>

        <h2>10. Governing Law, Arbitration and Class Action Waivers</h2>

        <h3>10.1 Governing Law and Jurisdiction</h3>

        <p>
          These Terms of Service, the Interfaces, and any dispute, claim or
          controversy arising out of or relating to them (including any
          non-contractual obligations or claims) shall be governed by and
          construed in accordance with the laws of the Republic of Seychelles,
          without regard to its conflict of laws principles.
        </p>

        <h3>10.2 Mandatory Arbitration</h3>

        <p>
          Any dispute, controversy or claim arising out of, relating to or in
          connection with these Terms of Service, the Interfaces, or the breach,
          termination, interpretation, validity or enforceability thereof
          (collectively, a &ldquo;<strong>Dispute</strong>&rdquo;) shall be
          finally and exclusively resolved by binding arbitration.
        </p>

        <h3>10.3 Arbitration Rules and Seat</h3>

        <p>
          The arbitration shall be conducted in accordance with the UNCITRAL
          Arbitration Rules (as in force at the time of the Dispute), except as
          modified herein. The seat (legal place) of arbitration shall be
          Seychelles. The arbitration shall be conducted in the English
          language.
        </p>

        <h3>10.4 Arbitral Tribunal</h3>

        <p>
          The arbitral tribunal shall consist of one (1) arbitrator, unless
          otherwise required by mandatory law.
        </p>

        <p>
          The arbitrator shall have the power to rule on their own jurisdiction,
          including any objection with respect to the existence, validity or
          enforceability of this arbitration agreement.
        </p>

        <h3>10.5 Final and Binding</h3>

        <p>
          The arbitral award shall be final, binding and enforceable upon the
          parties, and judgment upon the award may be entered in any court of
          competent jurisdiction.
        </p>

        <p>
          ANY DISPUTE, CONTROVERSY OR CLAIM ARISING OUT OF, RELATING TO OR IN
          CONNECTION WITH THESE TERMS, THE INTERFACES (OR ANY PORTION OR ALL OF
          THE FOREGOING), INCLUDING THE BREACH, TERMINATION OR VALIDITY OF THESE
          TERMS, SHALL BE FINALLY RESOLVED BY ARBITRATION. THE TRIBUNAL SHALL
          HAVE THE POWER TO RULE ON ANY CHALLENGE TO ITS OWN JURISDICTION OR TO
          THE VALIDITY OR ENFORCEABILITY OF ANY PORTION OF THE AGREEMENT TO
          ARBITRATE. THE PARTIES AGREE TO ARBITRATE SOLELY ON AN INDIVIDUAL
          BASIS, AND THAT THIS AGREEMENT DOES NOT PERMIT CLASS ARBITRATION OR
          ANY CLAIMS BROUGHT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR
          REPRESENTATIVE ARBITRATION PROCEEDING. THE ARBITRAL TRIBUNAL MAY NOT
          CONSOLIDATE MORE THAN ONE PERSON&rsquo;S CLAIMS, AND MAY NOT OTHERWISE
          PRESIDE OVER ANY FORM OF A REPRESENTATIVE OR CLASS PROCEEDING.
        </p>

        <h3>10.6 Limitation on Time to File Claims</h3>

        <p>
          ANY CAUSE OF ACTION OR CLAIM YOU MAY HAVE ARISING OUT OF OR RELATING
          TO THESE TERMS OF USE OR THE INTERFACES MUST BE COMMENCED WITHIN ONE
          (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES, OTHERWISE, SUCH CAUSE OF
          ACTION OR CLAIM IS PERMANENTLY BARRED.
        </p>

        <h3>10.7 Waiver and Severability</h3>

        <p>
          No waiver by the Company of any term or condition set out in these
          Terms of Service shall be deemed a further or continuing waiver of
          such term or condition or a waiver of any other term or condition, and
          any failure of Company to assert a right or provision under these
          Terms of Service shall not constitute a waiver of such right or
          provision.
        </p>

        <p>
          If any provision of these Terms of Service is held by a court or other
          tribunal of competent jurisdiction to be invalid, illegal or
          unenforceable for any reason, such provision shall be eliminated or
          limited to the minimum extent such that the remaining provisions of
          the Terms of Service will continue in full force and effect.
        </p>

        <h2>11. Miscellaneous</h2>

        <h3>11.1 Entire Agreement</h3>

        <p>
          These terms constitute the entire agreement between you and Us with
          respect to the subject matter hereof. This Agreement supersedes any
          and all prior or contemporaneous written and oral agreements,
          communications and other understandings (if any) relating to the
          subject matter of the Terms.
        </p>

        <h3>11.2 Not Registered with the SEC or Any Other Agency</h3>

        <p>
          The Interfaces are not financial platforms. We do not broker trades,
          provide liquidity, or handle asset custody. All transactions occur
          peer-to-peer via smart contracts on public blockchains.
        </p>

        <p>
          We are not registered with the U.S. Securities and Exchange
          Commission, or any other governmental or regulatory agency, as a
          national securities exchange or in any other capacity. You understand
          and acknowledge that we do not broker trading orders on your behalf.
          We also do not facilitate the execution or settlement of your trades,
          which occur entirely on public distributed blockchains like Bitcoin,
          Ethereum, Solana, Arbitrum, NEAR, or TON. As a result, we do not (and
          cannot) guarantee market best pricing or best execution through the
          Interfaces. Any references in a product to &quot;best price&quot; does
          not constitute a representation or warranty about pricing available
          through such product, on the Protocol, or elsewhere.
        </p>

        <h3>11.3 Notice</h3>

        <p>
          We may provide any notice to you under this Agreement using
          commercially reasonable means, including using public communication
          channels. Notices we provide by using public communication channels
          will be effective upon posting.
        </p>

        <p>
          If you have any questions about these Terms, please contact us at{" "}
          <a
            href="mailto:legal@polarexpress.dev"
            target="_blank"
            rel="noreferrer noopener"
          >
            legal@polarexpress.dev
          </a>
          .
        </p>

        <h3>11.4 Rights and Remedies</h3>

        <p>
          Any right or remedy of the Company set forth in these Terms is in
          addition to, and not in lieu of, any other right or remedy whether
          described in these Terms, under applicable laws, at law, or in equity.
          The failure or delay of Company in exercising any right, power, or
          privilege under these Terms will not operate as a waiver thereof.
        </p>

        <h3>11.5 Privacy Policy</h3>

        <p>
          Your use of the Interfaces is subject to our privacy policy, available
          at <Link href="/privacy">Privacy Policy</Link> (&ldquo;
          <strong>Privacy Policy</strong>&rdquo;). We may collect limited data,
          such as wallet addresses or usage analytics, to operate and improve
          the Interfaces. We do not store private keys or personal financial
          information, as the Interfaces are non-custodial. You acknowledge that
          blockchain transactions are inherently public and not controlled by
          the Company.
        </p>
      </div>
    </div>
  )
}
