alter table public.tire_measurements
  add column if not exists second_left_depth double precision,
  add column if not exists second_center_depth double precision,
  add column if not exists second_right_depth double precision;
