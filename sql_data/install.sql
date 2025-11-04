CREATE EXTENSION if not exists postgis;

SET search_path = hercules;

-- Create Tables for each schema 
-- P1 --------------------------------------------------------------

drop table p1_input;
drop table p1_grouped_data;

create table if not exists public.p1_input
(
    patient_id  text,
    location    text,
    start_time  text,
    end_time    text,
    x_location  decimal,
    y_location  decimal,
    step_length text
);

alter table public.p1_input
    owner to docker;

create index if not exists p1_input_patient_id_index
    on public.p1_input (patient_id);

create table if not exists public.p1_grouped_data
(
    patient_id           text,
    start_time           text,
    end_time             text,
    visit_length         text,
    day_of_week          text,
    tod                  text,
    hour                 integer,
    condition            varchar,
    visit_length_minutes text
);

alter table public.p1_grouped_data
    owner to docker;

create index if not exists p1_grouped_data_patient_id_index
    on public.p1_grouped_data (patient_id);

-- Make Sure Tables are empty
TRUNCATE TABLE public.p1_input;
TRUNCATE TABLE public.p1_grouped_data;

-- Copy Data into tables
\COPY public.p1_input FROM '/Users/sjg/git/hercules/data/live/P1/P1_input.csv' DELIMITER ',' CSV HEADER;
\COPY public.p1_grouped_data FROM '/Users/sjg/git/hercules/data/live/P1/P1_grouped_data.csv' DELIMITER ',' CSV HEADER;

-- Convert start_time and end_time to timestamp in both tables
ALTER TABLE public.p1_input ADD COLUMN start_time_ts timestamp;
UPDATE public.p1_input set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p1_input drop COLUMN start_time;
-- ALTER TABLE public.p1_input RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p1_input ADD COLUMN end_time_ts timestamp;
UPDATE public.p1_input set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p1_input drop COLUMN end_time;
-- ALTER TABLE public.p1_input RENAME COLUMN end_time_ts TO end_time;

ALTER TABLE public.p1_grouped_data ADD COLUMN start_time_ts timestamp;
UPDATE public.p1_grouped_data set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p1_grouped_data drop COLUMN start_time;
-- ALTER TABLE public.p1_grouped_data RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p1_grouped_data ADD COLUMN end_time_ts timestamp;
UPDATE public.p1_grouped_data set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p1_grouped_data drop COLUMN end_time;
-- ALTER TABLE public.p1_grouped_data RENAME COLUMN end_time_ts TO end_time;

-- -- P2 --------------------------------------------------------------
create table if not exists public.p2_input
(
    patient_id  text,
    location    text,
    start_time  text,
    end_time    text,
    x_location  decimal,
    y_location  decimal,
    step_length text
);

alter table public.p2_input
    owner to docker;

create index if not exists p2_input_patient_id_index
    on public.p2_input (patient_id);

create table if not exists public.p2_grouped_data
(
    patient_id           text,
    start_time           text,
    end_time             text,
    visit_length         text,
    day_of_week          text,
    tod                  text,
    hour                 integer,
    condition            varchar,
    visit_length_minutes text
);

alter table public.p2_grouped_data
    owner to docker;

create index if not exists p2_grouped_data_patient_id_index
    on public.p2_grouped_data (patient_id);

-- Make Sure Tables are empty
TRUNCATE TABLE public.p2_input;
TRUNCATE TABLE public.p2_grouped_data;

-- Copy Data into tables
COPY public.p2_input FROM '/Users/sjg/git/hercules/data/live/P2/P2_input.csv' DELIMITER ',' CSV HEADER;
COPY public.p2_grouped_data FROM '/Users/sjg/git/hercules/data/live/P2/P2_grouped_data.csv' DELIMITER ',' CSV HEADER;

-- Convert start_time and end_time to timestamp in both tables
ALTER TABLE public.p2_input ADD COLUMN start_time_ts timestamp;
UPDATE public.p2_input set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p2_input drop COLUMN start_time;
-- ALTER TABLE public.p2_input RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p2_input ADD COLUMN end_time_ts timestamp;
UPDATE public.p2_input set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p2_input drop COLUMN end_time;
-- ALTER TABLE public.p2_input RENAME COLUMN end_time_ts TO end_time;

ALTER TABLE public.p2_grouped_data ADD COLUMN start_time_ts timestamp;
UPDATE public.p2_grouped_data set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p2_grouped_data drop COLUMN start_time;
-- ALTER TABLE public.p2_grouped_data RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p2_grouped_data ADD COLUMN end_time_ts timestamp;
UPDATE public.p2_grouped_data set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p2_grouped_data drop COLUMN end_time;
-- ALTER TABLE public.p2_grouped_data RENAME COLUMN end_time_ts TO end_time;

-- -- P3 --------------------------------------------------------------
create table if not exists public.p3_input
(
    patient_id  text,
    location    text,
    start_time  text,
    end_time    text,
    x_location  decimal,
    y_location  decimal,
    step_length text
);

alter table public.p3_input
    owner to docker;

create index if not exists p3_input_patient_id_index
    on public.p3_input (patient_id);

create table if not exists public.p3_grouped_data
(
    patient_id           text,
    start_time           text,
    end_time             text,
    visit_length         text,
    day_of_week          text,
    tod                  text,
    hour                 integer,
    condition            varchar,
    visit_length_minutes text
);

alter table public.p3_grouped_data
    owner to docker;

create index if not exists p3_grouped_data_patient_id_index
    on public.p1_grouped_data (patient_id);

-- Make Sure Tables are empty
TRUNCATE TABLE public.p3_input;
TRUNCATE TABLE public.p3_grouped_data;

-- Copy Data into tables
COPY public.p3_input FROM '/Users/sjg/git/hercules/data/live/P3/P3_input.csv' DELIMITER ',' CSV HEADER;
COPY public.p3_grouped_data FROM '/Users/sjg/git/hercules/data/live/P3/P3_grouped_data.csv' DELIMITER ',' CSV HEADER;

-- Convert start_time and end_time to timestamp in both tables
ALTER TABLE public.p3_input ADD COLUMN start_time_ts timestamp;
UPDATE public.p3_input set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p3_input drop COLUMN start_time;
-- ALTER TABLE public.p3_input RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p3_input ADD COLUMN end_time_ts timestamp;
UPDATE public.p3_input set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p3_input drop COLUMN end_time;
-- ALTER TABLE public.p3_input RENAME COLUMN end_time_ts TO end_time;

ALTER TABLE public.p3_grouped_data ADD COLUMN start_time_ts timestamp;
UPDATE public.p3_grouped_data set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p3_grouped_data drop COLUMN start_time;
-- ALTER TABLE public.p3_grouped_data RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p3_grouped_data ADD COLUMN end_time_ts timestamp;
UPDATE public.p3_grouped_data set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p3_grouped_data drop COLUMN end_time;
-- ALTER TABLE public.p3_grouped_data RENAME COLUMN end_time_ts TO end_time;

-- -- P4 --------------------------------------------------------------
create table if not exists public.p4_input
(
    patient_id  text,
    location    text,
    start_time  text,
    end_time    text,
    x_location  decimal,
    y_location  decimal,
    step_length text
);

alter table public.p4_input
    owner to docker;

create index if not exists p4_input_patient_id_index
    on public.p4_input (patient_id);

create table if not exists public.p4_grouped_data
(
    patient_id           text,
    start_time           text,
    end_time             text,
    visit_length         text,
    day_of_week          text,
    tod                  text,
    hour                 integer,
    condition            varchar,
    visit_length_minutes text
);

alter table public.p4_grouped_data
    owner to docker;

create index if not exists p4_grouped_data_patient_id_index
    on public.p4_grouped_data (patient_id);

-- Make Sure Tables are empty
TRUNCATE TABLE public.p4_input;
TRUNCATE TABLE public.p4_grouped_data;

-- Copy Data into tables
COPY public.p4_input FROM '/Users/sjg/git/hercules/data/live/P4/P4_input.csv' DELIMITER ',' CSV HEADER;
COPY public.p4_grouped_data FROM '/Users/sjg/git/hercules/data/live/P4/P4_grouped_data.csv' DELIMITER ',' CSV HEADER;

-- Convert start_time and end_time to timestamp in both tables
ALTER TABLE public.p4_input ADD COLUMN start_time_ts timestamp;
UPDATE public.p4_input set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p4_input drop COLUMN start_time;
-- ALTER TABLE public.p4_input RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p4_input ADD COLUMN end_time_ts timestamp;
UPDATE public.p4_input set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p4_input drop COLUMN end_time;
-- ALTER TABLE public.p4_input RENAME COLUMN end_time_ts TO end_time;

ALTER TABLE public.p4_grouped_data ADD COLUMN start_time_ts timestamp;
UPDATE public.p4_grouped_data set start_time_ts = to_timestamp(start_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p4_grouped_data drop COLUMN start_time;
-- ALTER TABLE public.p4_grouped_data RENAME COLUMN start_time_ts TO start_time;

ALTER TABLE public.p4_grouped_data ADD COLUMN end_time_ts timestamp;
UPDATE public.p4_grouped_data set end_time_ts = to_timestamp(end_time,'YYYY-MM-DD HH24:MI:SS');
-- ALTER TABLE public.p4_grouped_data drop COLUMN end_time;
-- ALTER TABLE public.p4_grouped_data RENAME COLUMN end_time_ts TO end_time;