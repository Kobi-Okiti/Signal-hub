export type SubscriptionStatus = "active" | "expired";

export interface Subscriber {
  id: string;
  user_id: string;
  community_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export type SubscriberWithUser = Subscriber & {
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
};
