CREATE TABLE myhomereno_projects (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL,
    summary TEXT,
    estimated_cost TEXT NOT NULL,
    room TEXT NOT NULL,
    details TEXT NOT NULL,
    total_time TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    date_created TIMESTAMPTZ DEFAULT now() NOT NULL
);
