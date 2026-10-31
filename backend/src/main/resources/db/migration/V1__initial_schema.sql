-- PetHub schema: versioned migration; compatible with PostgreSQL and H2.

create table accounts (
    id varchar(36) primary key,
    version bigint not null default 0,
    name varchar(255),
    email varchar(255) unique,
    password_hash varchar(255),
    role varchar(255),
    address varchar(255),
    active boolean not null
);

create table sessions (
    id varchar(36) primary key,
    version bigint not null default 0,
    account_id varchar(255),
    token_hash varchar(255) unique,
    expires_at timestamp(6) with time zone
);

create table pets (
    id varchar(36) primary key,
    version bigint not null default 0,
    owner_id varchar(255),
    name varchar(255),
    species varchar(255),
    breed varchar(255),
    age_label varchar(255),
    weight_kg numeric(38,2),
    size varchar(255),
    avatar_url varchar(255),
    vaccine_status varchar(255),
    severe_dermatitis_history boolean not null,
    active boolean not null
);

create table shops (
    id varchar(36) primary key,
    version bigint not null default 0,
    owner_id varchar(255) unique,
    name varchar(255),
    description varchar(255),
    address varchar(255),
    neighborhood varchar(255),
    latitude double precision not null,
    longitude double precision not null,
    service_radius_km double precision not null,
    delivery_preparation_minutes integer not null,
    delivery_fee numeric(38,2),
    taxi_dog_fee numeric(38,2),
    time_zone varchar(255),
    logo_url varchar(255),
    banner_url varchar(255),
    status varchar(255),
    advance_payout boolean not null,
    sponsored boolean not null
);

create table products (
    id varchar(36) primary key,
    version bigint not null default 0,
    store_id varchar(255),
    name varchar(255),
    description varchar(255),
    category varchar(255),
    price numeric(38,2),
    stock integer not null,
    unit_label varchar(255),
    image_url varchar(255),
    active boolean not null
);

create table grooming_services (
    id varchar(36) primary key,
    version bigint not null default 0,
    store_id varchar(255),
    name varchar(255),
    description varchar(255),
    category varchar(255),
    duration_minutes integer not null,
    small_price numeric(38,2),
    medium_price numeric(38,2),
    large_price numeric(38,2),
    therapeutic boolean not null,
    image_url varchar(255),
    active boolean not null
);

create table bays (
    id varchar(36) primary key,
    version bigint not null default 0,
    store_id varchar(255),
    name varchar(255),
    size varchar(255),
    active boolean not null
);

create table bay_windows (
    id varchar(36) primary key,
    version bigint not null default 0,
    store_id varchar(255),
    bay_id varchar(255),
    starts_at timestamp(6) with time zone,
    ends_at timestamp(6) with time zone
);

create table purchases (
    id varchar(36) primary key,
    version bigint not null default 0,
    tutor_id varchar(255),
    store_id varchar(255),
    created_at timestamp(6) with time zone,
    sla_deadline timestamp(6) with time zone,
    accepted_at timestamp(6) with time zone,
    completed_at timestamp(6) with time zone,
    idempotency_key varchar(255),
    request_hash varchar(255),
    status varchar(255),
    fulfillment_mode varchar(255),
    payment_method varchar(255),
    delivery_address varchar(255),
    subtotal numeric(38,2),
    delivery_fee numeric(38,2),
    total numeric(38,2),
    platform_take_rate_amount numeric(38,2),
    merchant_net_amount numeric(38,2),
    no_show_fee numeric(38,2),
    rejection_reason varchar(255),
    resources_released boolean not null,
    pet_id varchar(255),
    service_id varchar(255),
    service_name varchar(255),
    therapeutic_service boolean not null,
    pet_name varchar(255),
    pet_size varchar(255),
    bay_id varchar(255),
    scheduled_at timestamp(6) with time zone,
    scheduled_end timestamp(6) with time zone,
    service_price numeric(38,2),
    taxi_dog_fee numeric(38,2),
    taxi_dog boolean not null,
    bay_released boolean not null,
    checked_in_at timestamp(6) with time zone,
    triage_done boolean not null,
    sanitary_required boolean not null,
    grooming_stage varchar(255),
    unique (tutor_id, idempotency_key)
);

create table order_items (
    id varchar(36) primary key,
    version bigint not null default 0,
    order_id varchar(255),
    product_id varchar(255),
    product_name varchar(255),
    quantity integer not null,
    unit_price numeric(38,2)
);

create table addons (
    id varchar(36) primary key,
    version bigint not null default 0,
    order_id varchar(255),
    product_id varchar(255),
    service_id varchar(255),
    title varchar(255),
    reason varchar(255),
    price numeric(38,2),
    quantity integer not null,
    duration_minutes integer not null,
    mandatory_sanitary boolean not null,
    stock_reserved boolean not null,
    status varchar(255)
);

create table reviews (
    id varchar(36) primary key,
    version bigint not null default 0,
    order_id varchar(255) unique,
    store_id varchar(255),
    rating integer not null,
    comment varchar(255),
    created_at timestamp(6) with time zone
);

create table behavior_notes (
    id varchar(36) primary key,
    version bigint not null default 0,
    order_id varchar(255),
    pet_id varchar(255),
    store_id varchar(255),
    note varchar(255),
    created_at timestamp(6) with time zone
);

create table notifications (
    id bigint generated by default as identity primary key,
    recipient_id varchar(255),
    order_id varchar(255),
    type varchar(255),
    message varchar(255),
    created_at timestamp(6) with time zone,
    deadline timestamp(6) with time zone
);

create table payments (
    id varchar(36) primary key,
    version bigint not null default 0,
    order_id varchar(255),
    addon_id varchar(255),
    store_id varchar(255),
    method varchar(255),
    status varchar(255),
    amount numeric(38,2),
    platform_fee numeric(38,2),
    refunded_amount numeric(38,2),
    desired_refund numeric(38,2),
    provider_id varchar(255),
    qr_code varchar(255),
    qr_code_base64 varchar(12000),
    provider_release_date timestamp(6) with time zone,
    encrypted_request varchar(6000),
    task varchar(255),
    attempts integer not null,
    retry_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    error_code varchar(255),
    capture_requested boolean not null,
    cancel_requested boolean not null,
    local_simulation boolean not null
);

create table payment_accounts (
    id varchar(36) primary key,
    version bigint not null default 0,
    store_id varchar(255) unique,
    access_token varchar(4000),
    refresh_token varchar(4000),
    expires_at timestamp(6) with time zone,
    provider_user_id varchar(255),
    public_key varchar(255)
);

create table oauth_states (
    id varchar(36) primary key,
    version bigint not null default 0,
    store_id varchar(255),
    state_hash varchar(255),
    code_verifier varchar(255),
    expires_at timestamp(6) with time zone
);

create table receivables (
    id varchar(36) primary key,
    version bigint not null default 0,
    order_id varchar(255) unique,
    store_id varchar(255),
    gross numeric(38,2),
    platform_fee numeric(38,2),
    merchant_amount numeric(38,2),
    advance_fee numeric(38,2),
    expected_net numeric(38,2),
    expected_at timestamp(6) with time zone,
    status varchar(255)
);

alter table sessions add constraint fk_sessions_account_id foreign key (account_id) references accounts(id);

alter table pets add constraint fk_pets_owner_id foreign key (owner_id) references accounts(id);

alter table shops add constraint fk_shops_owner_id foreign key (owner_id) references accounts(id);

alter table products add constraint fk_products_store_id foreign key (store_id) references shops(id);

alter table grooming_services add constraint fk_grooming_services_store_id foreign key (store_id) references shops(id);

alter table bays add constraint fk_bays_store_id foreign key (store_id) references shops(id);

alter table bay_windows add constraint fk_bay_windows_store_id foreign key (store_id) references shops(id);

alter table bay_windows add constraint fk_bay_windows_bay_id foreign key (bay_id) references bays(id);

alter table purchases add constraint fk_purchases_tutor_id foreign key (tutor_id) references accounts(id);

alter table purchases add constraint fk_purchases_store_id foreign key (store_id) references shops(id);

alter table purchases add constraint fk_purchases_pet_id foreign key (pet_id) references pets(id);

alter table purchases add constraint fk_purchases_service_id foreign key (service_id) references grooming_services(id);

alter table purchases add constraint fk_purchases_bay_id foreign key (bay_id) references bays(id);

alter table order_items add constraint fk_order_items_order_id foreign key (order_id) references purchases(id);

alter table order_items add constraint fk_order_items_product_id foreign key (product_id) references products(id);

alter table addons add constraint fk_addons_order_id foreign key (order_id) references purchases(id);

alter table addons add constraint fk_addons_product_id foreign key (product_id) references products(id);

alter table addons add constraint fk_addons_service_id foreign key (service_id) references grooming_services(id);

alter table reviews add constraint fk_reviews_order_id foreign key (order_id) references purchases(id);

alter table reviews add constraint fk_reviews_store_id foreign key (store_id) references shops(id);

alter table behavior_notes add constraint fk_behavior_notes_order_id foreign key (order_id) references purchases(id);

alter table behavior_notes add constraint fk_behavior_notes_pet_id foreign key (pet_id) references pets(id);

alter table behavior_notes add constraint fk_behavior_notes_store_id foreign key (store_id) references shops(id);

alter table notifications add constraint fk_notifications_recipient_id foreign key (recipient_id) references accounts(id);

alter table notifications add constraint fk_notifications_order_id foreign key (order_id) references purchases(id);

alter table payments add constraint fk_payments_order_id foreign key (order_id) references purchases(id);

alter table payments add constraint fk_payments_store_id foreign key (store_id) references shops(id);

alter table payments add constraint fk_payments_addon_id foreign key (addon_id) references addons(id);

alter table payment_accounts add constraint fk_payment_accounts_store_id foreign key (store_id) references shops(id);

alter table oauth_states add constraint fk_oauth_states_store_id foreign key (store_id) references shops(id);

alter table receivables add constraint fk_receivables_order_id foreign key (order_id) references purchases(id);

alter table receivables add constraint fk_receivables_store_id foreign key (store_id) references shops(id);

alter table products add constraint ck_product_stock check (stock >= 0);

alter table products add constraint ck_product_price check (price > 0);

alter table reviews add constraint ck_review_rating check (rating between 1 and 5);

alter table bay_windows add constraint ck_window_period check (ends_at > starts_at);

alter table payments add constraint ck_payment_amount check (amount > 0 and refunded_amount >= 0 and desired_refund >= 0 and desired_refund <= amount);

create index idx_order_sla on purchases(status, sla_deadline);

create index idx_order_bay on purchases(bay_id, bay_released, scheduled_at, scheduled_end);

create index idx_order_tutor on purchases(tutor_id, created_at);

create index idx_order_store on purchases(store_id, created_at);

create index idx_payment_retry on payments(retry_at);

create unique index idx_payment_provider on payments(provider_id);

create index idx_payment_order on payments(order_id);

create index idx_notifications_recipient on notifications(recipient_id, id);

create index idx_shop_location on shops(status, latitude, longitude);

create index idx_window_bay on bay_windows(bay_id, starts_at, ends_at);

create index idx_product_store on products(store_id, active);

create index idx_service_store on grooming_services(store_id, active);

create index idx_order_items on order_items(order_id);

create index idx_addons_order on addons(order_id);

create index idx_pet_notes on behavior_notes(pet_id, created_at);
