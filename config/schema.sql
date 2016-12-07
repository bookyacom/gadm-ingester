DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
       CREATE TYPE location_type as enum('country', 'poi', 'provience', 'district', 'region', 'city', 'state');
    END IF;
END$$;

CREATE TABLE if not exists TABLE_NAME
(
  id serial NOT NULL,
  name character varying(255) NOT NULL,
  unit character varying(255),
  street character varying(255),
  full_address text,
  region character varying(255),
  state character varying(255),
  postcode character varying(255),
  district character varying(255),
  city character varying(255),
  provience character varying(255),
  country character varying(255),
  point geometry(Point),
  pg_zone geography(MultiPolygon,4326),
  type location_type,
  created_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  region_2 character varying(255),
  region_1 character varying(255),
  CONSTRAINT TABLE_NAME_pkey PRIMARY KEY (id)
);