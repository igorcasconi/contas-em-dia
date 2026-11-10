
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "banks": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"bills": {
                  Row: {
                    "amount_cents": number | null,"category_id": string,"created_at": string,"ended_at": string | null,"id": string,"name": string,"user_id": string,"value_mode": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents"?: number | null,"category_id": string,"created_at"?: string,"ended_at"?: string | null,"id"?: string,"name": string,"user_id"?: string,"value_mode": string
                  }
                  Update: {
                    "amount_cents"?: number | null,"category_id"?: string,"created_at"?: string,"ended_at"?: string | null,"id"?: string,"name"?: string,"user_id"?: string,"value_mode"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bills_category_fkey"
      columns: ["category_id","user_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"card_items": {
                  Row: {
                    "amount_cents": number,"bank_id": string,"category_id": string,"created_at": string,"ended_at": string | null,"id": string,"name": string,"remaining_months": number | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"bank_id": string,"category_id": string,"created_at"?: string,"ended_at"?: string | null,"id"?: string,"name": string,"remaining_months"?: number | null,"status"?: string,"user_id"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"bank_id"?: string,"category_id"?: string,"created_at"?: string,"ended_at"?: string | null,"id"?: string,"name"?: string,"remaining_months"?: number | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "card_items_bank_fkey"
      columns: ["bank_id","user_id"]
isOneToOne: false
      referencedRelation: "banks"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "card_items_category_fkey"
      columns: ["category_id","user_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"card_purchases": {
                  Row: {
                    "amount_cents": number,"bank_id": string,"category_id": string,"created_at": string,"id": string,"month": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"bank_id": string,"category_id": string,"created_at"?: string,"id"?: string,"month"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"bank_id"?: string,"category_id"?: string,"created_at"?: string,"id"?: string,"month"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "card_purchases_bank_fkey"
      columns: ["bank_id","user_id"]
isOneToOne: false
      referencedRelation: "banks"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "card_purchases_category_fkey"
      columns: ["category_id","user_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"payment_items": {
                  Row: {
                    "amount_cents": number,"card_item_id": string,"id": string,"included": boolean,"payment_id": string,"prev_ended_at": string | null,"prev_remaining_months": number | null,"prev_status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"card_item_id": string,"id"?: string,"included": boolean,"payment_id": string,"prev_ended_at"?: string | null,"prev_remaining_months"?: number | null,"prev_status": string,"user_id": string
                  }
                  Update: {
                    "amount_cents"?: number,"card_item_id"?: string,"id"?: string,"included"?: boolean,"payment_id"?: string,"prev_ended_at"?: string | null,"prev_remaining_months"?: number | null,"prev_status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_items_card_item_fkey"
      columns: ["card_item_id","user_id"]
isOneToOne: false
      referencedRelation: "card_items"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "payment_items_payment_fkey"
      columns: ["payment_id","user_id"]
isOneToOne: false
      referencedRelation: "payments"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "bank_id": string | null,"bill_id": string | null,"created_at": string,"id": string,"kind": string,"month": string,"total_cents": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bank_id"?: string | null,"bill_id"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"month": string,"total_cents": number,"user_id": string
                  }
                  Update: {
                    "bank_id"?: string | null,"bill_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"month"?: string,"total_cents"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_bank_fkey"
      columns: ["bank_id","user_id"]
isOneToOne: false
      referencedRelation: "banks"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "payments_bill_fkey"
      columns: ["bill_id","user_id"]
isOneToOne: false
      referencedRelation: "bills"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"salaries": {
                  Row: {
                    "amount_cents": number,"created_at": string,"effective_month": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_cents": number,"created_at"?: string,"effective_month": string,"id"?: string,"user_id"?: string
                  }
                  Update: {
                    "amount_cents"?: number,"created_at"?: string,"effective_month"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "assert_card_invoice_open":
{ Args: { "p_bank_id": string,"p_user_id": string }; Returns: undefined
                           },
"card_selection":
{ Args: { "p_bank_id": string,"p_items": Json,"p_user_id": string }; Returns: {
              "amount_cents": number,"card_item_id": string,"ended_at": string,"included": boolean,"pause": boolean,"remaining_months": number,"status": string
            }[]
                           },
"complete_onboarding":
{ Args: { "p_amount_cents": number,"p_name": string }; Returns: undefined
                           },
"current_month":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"insert_payment":
{ Args: { "p_bank_id": string,"p_bill_id": string,"p_kind": string,"p_total_cents": number,"p_user_id": string }; Returns: string
                           },
"pay_bill":
{ Args: { "p_amount_cents"?: number,"p_bill_id": string }; Returns: string
                           },
"pay_card":
{ Args: { "p_bank_id": string,"p_items": Json }; Returns: string
                           },
"undo_payment":
{ Args: { "p_payment_id": string }; Returns: undefined
                           },
"update_salary":
{ Args: { "p_amount_cents": number }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
