/**
 * Generated database types for GeauxFind's Supabase schema.
 * Re-run `npx supabase gen types typescript` after schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          review_count: number
          recipe_count: number
          tip_count: number
          reputation_score: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'review_count' | 'recipe_count' | 'tip_count' | 'reputation_score' | 'created_at'> & Partial<Pick<Database['public']['Tables']['profiles']['Row'], 'review_count' | 'recipe_count' | 'tip_count' | 'reputation_score' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      places: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          cuisine: string[] | null
          description: string | null
          short_description: string | null
          address: string | null
          city: string
          zip: string | null
          lat: number | null
          lng: number | null
          phone: string | null
          website: string | null
          hours: Json | null
          price_range: number | null
          google_rating: number | null
          google_review_count: number | null
          yelp_rating: number | null
          yelp_review_count: number | null
          community_rating: number | null
          community_review_count: number
          google_place_id: string | null
          yelp_id: string | null
          cover_photo: string | null
          photos: string[] | null
          is_featured: boolean
          is_verified: boolean
          tags: string[] | null
          categories: string[] | null
          offerings: string[] | null
          socials: Json | null
          source: string | null
          ai_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'id' | 'community_review_count' | 'is_featured' | 'is_verified' | 'created_at' | 'updated_at'> & Partial<Pick<Database['public']['Tables']['places']['Row'], 'id' | 'community_review_count' | 'is_featured' | 'is_verified' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['places']['Row']>
      }
      events: {
        Row: {
          id: string
          name: string
          slug: string
          type: string
          description: string | null
          start_date: string
          end_date: string | null
          time: string | null
          is_recurring: boolean
          recurrence_rule: string | null
          venue: string | null
          address: string | null
          city: string | null
          lat: number | null
          lng: number | null
          place_id: string | null
          price: string | null
          free: boolean | null
          ticket_url: string | null
          website: string | null
          lineup: string[] | null
          food_vendors: string[] | null
          cover_photo: string | null
          photos: string[] | null
          is_featured: boolean
          tags: string[] | null
          source: string | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'is_recurring' | 'is_featured' | 'created_at' | 'updated_at'> & Partial<Pick<Database['public']['Tables']['events']['Row'], 'id' | 'is_recurring' | 'is_featured' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['events']['Row']>
      }
      recipes: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          category: string | null
          ingredients: Json
          instructions: Json
          prep_time: number | null
          cook_time: number | null
          servings: number | null
          difficulty: string | null
          cover_photo: string | null
          photos: string[] | null
          video_url: string | null
          author_id: string | null
          community_rating: number | null
          rating_count: number
          ai_tips: string | null
          inspired_by: string | null
          is_featured: boolean
          tags: string[] | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'rating_count' | 'is_featured' | 'created_at' | 'updated_at'> & Partial<Pick<Database['public']['Tables']['recipes']['Row'], 'id' | 'rating_count' | 'is_featured' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['recipes']['Row']>
      }
      reviews: {
        Row: {
          id: string
          place_id: string | null
          author_id: string
          rating: number | null
          text: string | null
          photos: string[] | null
          recommended_dishes: string[] | null
          upvotes: number
          is_verified: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'upvotes' | 'is_verified' | 'created_at'> & Partial<Pick<Database['public']['Tables']['reviews']['Row'], 'id' | 'upvotes' | 'is_verified' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
      best_of_lists: {
        Row: {
          id: string
          title: string
          slug: string
          category: string
          description: string | null
          entries: Json
          methodology: string | null
          last_updated: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['best_of_lists']['Row'], 'id' | 'last_updated' | 'created_at'> & Partial<Pick<Database['public']['Tables']['best_of_lists']['Row'], 'id' | 'last_updated' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['best_of_lists']['Row']>
      }
      questions: {
        Row: {
          id: string
          author_id: string | null
          question: string
          ai_answer: string | null
          ai_sources: Json | null
          answer_count: number
          upvotes: number
          tags: string[] | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'answer_count' | 'upvotes' | 'created_at'> & Partial<Pick<Database['public']['Tables']['questions']['Row'], 'id' | 'answer_count' | 'upvotes' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['questions']['Row']>
      }
      answers: {
        Row: {
          id: string
          question_id: string
          author_id: string
          text: string
          place_id: string | null
          upvotes: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['answers']['Row'], 'id' | 'upvotes' | 'created_at'> & Partial<Pick<Database['public']['Tables']['answers']['Row'], 'id' | 'upvotes' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['answers']['Row']>
      }
      intake_dumps: {
        Row: {
          id: string
          raw_text: string
          source: string | null
          processed: boolean
          parsed_items: Json | null
          items_created: number
          created_at: string
          processed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['intake_dumps']['Row'], 'id' | 'processed' | 'items_created' | 'created_at'> & Partial<Pick<Database['public']['Tables']['intake_dumps']['Row'], 'id' | 'processed' | 'items_created' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['intake_dumps']['Row']>
      }
      crawfish_prices: {
        Row: {
          id: string
          name: string
          slug: string
          address: string | null
          city: string
          boiled_price_per_lb: number | null
          boiled_price_text: string | null
          live_price_per_lb: number | null
          live_price_text: string | null
          boiled_size: string | null
          live_size: string | null
          rating: number | null
          phone: string | null
          hours: string | null
          source: string
          source_updated_at: string | null
          fetched_at: string
        }
        Insert: Omit<Database['public']['Tables']['crawfish_prices']['Row'], 'id' | 'fetched_at'> & Partial<Pick<Database['public']['Tables']['crawfish_prices']['Row'], 'id' | 'fetched_at'>>
        Update: Partial<Database['public']['Tables']['crawfish_prices']['Row']>
      }
      live_music_venues: {
        Row: {
          id: string
          slug: string
          name: string
          city: string
          address: string | null
          website: string | null
          facebook: string | null
          instagram: string | null
          music_nights: Json
          genres: string[] | null
          description: string | null
          place_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['live_music_venues']['Row'], 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Database['public']['Tables']['live_music_venues']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['live_music_venues']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
