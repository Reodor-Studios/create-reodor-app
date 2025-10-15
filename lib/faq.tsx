import { Calendar, CreditCard, MessageCircle, Users } from "lucide-react";

export type FAQCategory = {
  id: string;
  name: string;
  icon: React.ReactNode | null;
};

export type FAQ = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const faqCategories: FAQCategory[] = [
  { id: "all", name: "All", icon: null },
  { id: "account", name: "Account", icon: <Users className="w-4 h-4" /> },
  {
    id: "billing",
    name: "Billing",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    id: "features",
    name: "Features",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "general",
    name: "General",
    icon: <MessageCircle className="w-4 h-4" />,
  },
];

export const faqs: FAQ[] = [
  {
    id: "1",
    category: "account",
    question: "How do I create an account?",
    answer:
      "You can create an account by clicking the 'Sign Up' button and following the registration process. You'll need to provide your email address and create a secure password. We'll send you a verification email to confirm your account.",
  },
  {
    id: "2",
    category: "account",
    question: "Can I change my account information?",
    answer:
      "Yes, you can update your account information at any time by going to your profile settings. You can modify your name, email, password, and other preferences. Some changes may require email verification.",
  },
  {
    id: "3",
    category: "billing",
    question: "When will I be charged?",
    answer:
      "Billing cycles begin on the day you subscribe to a plan. You'll be charged automatically on your billing date each month or year, depending on your selected plan. You can view your next billing date in your account settings.",
  },
  {
    id: "4",
    category: "billing",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. All payments are processed securely through Stripe, and we never store your full payment information.",
  },
  {
    id: "5",
    category: "features",
    question: "What features are included in my plan?",
    answer:
      "Each plan includes different features and limits. You can view a detailed comparison of all available features on our pricing page. Upgrades and downgrades can be made at any time from your account settings.",
  },
  {
    id: "6",
    category: "general",
    question: "Is my data secure?",
    answer:
      "Yes, we take data security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and regularly audit our systems. Your data is stored securely and never shared with third parties without your consent.",
  },
  {
    id: "7",
    category: "account",
    question: "How do I delete my account?",
    answer:
      "You can delete your account from the account settings page. Please note that this action is permanent and will remove all your data from our systems. Make sure to export any important data before proceeding.",
  },
  {
    id: "8",
    category: "billing",
    question: "Can I get a refund?",
    answer:
      "We offer a 30-day money-back guarantee for new customers. If you're not satisfied with our service, contact our support team within 30 days of your initial purchase for a full refund. Refunds for subsequent billing periods are evaluated on a case-by-case basis.",
  },
  {
    id: "9",
    category: "features",
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes, you can change your plan at any time from your account settings. Upgrades take effect immediately, while downgrades will take effect at the start of your next billing cycle. You'll be charged or credited accordingly.",
  },
  {
    id: "10",
    category: "general",
    question: "How can I contact support?",
    answer:
      "You can reach our support team through the contact form on our website, via email, or through the live chat feature in your account dashboard. We typically respond within 24 hours on business days.",
  },
];

export function filterFAQs({
  faqs,
  category,
  searchTerm,
}: {
  faqs: FAQ[];
  category: string;
  searchTerm: string;
}) {
  return faqs.filter((faq) => {
    const matchesCategory = category === "all" || faq.category === category;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

export function getFAQsByCategory(category: string) {
  return faqs.filter((faq) => faq.category === category);
}

export function getPopularFAQs(category: string, limit: number = 3) {
  const categoryFAQs = category === "all" ? faqs : getFAQsByCategory(category);
  return categoryFAQs.slice(0, limit);
}
