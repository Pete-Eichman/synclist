export interface List {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  created_at: Date;
}

export interface ListItem {
  id: string;
  list_id: string;
  text: string;
  checked: boolean;
  position: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ListWithItems extends List {
  items: ListItem[];
}
