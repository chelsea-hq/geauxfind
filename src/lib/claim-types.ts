export type ClaimPlan = "free" | "premium";

export type BusinessClaimSubmission = {
  id: string;
  slug: string;
  businessName: string;
  verification: {
    claimantName: string;
    role: string;
    email: string;
    phone: string;
  };
  listingUpdates: {
    logoFileName?: string;
    coverFileName?: string;
    description: string;
    hours: string;
    website: string;
    socialLinks: {
      instagram?: string;
      facebook?: string;
      tiktok?: string;
      x?: string;
    };
  };
  firstDeal?: {
    title: string;
    details: string;
    expiresOn?: string;
  };
  plan: ClaimPlan;
  status: "pending";
  createdAt: string;
};

export type NewBusinessSubmission = {
  id: string;
  name: string;
  category: string;
  cuisineType: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  hours: string;
  photos: string[];
  status: "pending";
  createdAt: string;
};
