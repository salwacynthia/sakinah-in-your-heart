import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

interface PaywallProps {
  onClose: () => void;
}

const tiers = [
  {
    name: "Sakinah+",
    price: "$1.99/mo",
    features: ["Unlimited reflections", "No ads, ever"],
    highlight: true,
  },
  {
    name: "Sakinah Family",
    price: "$7.99/mo",
    features: [
      "Everything in Sakinah+",
      "Shared across up to 5 people",
      "Each member gets their own private journal",
    ],
    highlight: false,
  },
];

const Paywall = ({ onClose }: PaywallProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <Sparkles className="mx-auto mb-4 text-primary" size={28} />
      <h2 className="text-xl sm:text-2xl font-light text-foreground mb-2">
        You've used today's 3 free reflections
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Come back tomorrow, or continue now with unlimited guidance.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl p-6 text-left border ${
              tier.highlight
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            <h3 className="text-sm font-medium text-foreground mb-1">
              {tier.name}
            </h3>
            <p className="text-lg font-light text-primary mb-4">{tier.price}</p>
            <ul className="space-y-2 mb-5">
              {tier.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Check size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() =>
                alert(
                  "Payment integration coming soon — thanks for your patience!",
                )
              }
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                tier.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/85"
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              Upgrade
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Maybe later
      </button>
    </motion.div>
  );
};

export default Paywall;
