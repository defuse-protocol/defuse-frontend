import type { Settings } from "@src/types/interfaces"

export const settings: Settings = {
  appName: "NEAR Intents",
  metadata: {
    home: {
      title: "Cross-Chain Asset Swapping",
      description:
        "Swap ensures fast transactions and the best rates across multiple blockchains. Start swapping today for a superior trading experience.",
    },
    deposit: {
      title: "Deposit Multichain DeFi Hub",
      description:
        "Seamlessly manage your cross-chain deposits with our efficient DeFi hub. Join us to experience unparalleled ease and security.",
    },
    jobs: {
      title: "Careers - Join Our Team",
      description:
        "Join for exciting careers in blockchain and cross-chain technology. Apply today and start shaping the future of decentralized finance!",
    },
    landing: {
      title: "Your Multichain DeFi Hub",
      description:
        "The premier platform for cross-chain liquidity and trading. Experience efficient, secure, and transparent swaps across multiple blockchains.",
    },
    wallet: {
      title: "Manage Your Digital Wallet",
      description:
        "Secure and easy access to your digital assets. Track balances, manage transactions, and more.",
    },
    withdraw: {
      title: "Withdraw Trusted Financial Partner",
      description:
        "Easily manage your withdrawals with our secure and user-friendly platform. Experience seamless transactions and exceptional support.",
    },
    giftCreate: {
      title: "Gift Card",
      description:
        "Receive assets from friends and start your journey on NEAR Intents, hassle-free",
    },
    giftView: {
      title: "Сlaim your Gift",
      description:
        "Receive assets from friends and start your journey on NEAR Intents, hassle-free",
      openGraph: {
        type: "website",
        images: "/static/images/og-gift-card.jpg",
        title: "Сlaim your Gift",
        description:
          "Receive assets from friends and start your journey on NEAR Intents, hassle-free",
      },
      twitter: {
        images: "/static/images/og-gift-card.jpg",
        title: "Сlaim your Gift",
        description:
          "Receive assets from friends and start your journey on NEAR Intents, hassle-free",
      },
    },
    explore: {
      title: "Explore",
      description: "Explore the world of NEAR Intents",
    },
  },
}
