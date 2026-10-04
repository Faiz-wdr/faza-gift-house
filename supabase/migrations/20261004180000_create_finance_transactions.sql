-- Finance Transactions Table
create table if not exists public.finance_transactions (
    id text primary key,
    type text not null check (type in ('income', 'expense')),
    amount numeric(10, 2) not null check (amount >= 0),
    date date not null,
    description text not null,
    category text,
    payment_method text,
    order_id text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Index for speedy monthly queries
create index if not exists idx_finance_transactions_date on public.finance_transactions(date);
create index if not exists idx_finance_transactions_type on public.finance_transactions(type);
create index if not exists idx_finance_transactions_order on public.finance_transactions(order_id);

-- RLS policies
alter table public.finance_transactions enable row level security;

create policy "Allow authenticated full access to finance_transactions"
    on public.finance_transactions for all
    to authenticated
    using (true)
    with check (true);

create policy "Allow anon full access to finance_transactions (if public admin)"
    on public.finance_transactions for all
    to anon
    using (true)
    with check (true);
