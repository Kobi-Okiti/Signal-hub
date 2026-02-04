export type Rating = 1 | 2 | 3 | 4 | 5;

export type ReviewUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

export interface Review {
  id: string;
  user_id: string;
  community_id: string;
  rating: Rating;
  review: string;
  created_at: string;
  users: ReviewUser;
}
