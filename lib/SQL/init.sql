-- DUCKDB DATABASE

CREATE SEQUENCE IF NOT EXISTS perigeu_config_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS perigeu_procedures_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS perigeu_routes_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS perigeu_scripts_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS perigeu_utils_id_seq START 1;

CREATE TABLE perigeu_config (
    id BIGINT PRIMARY KEY DEFAULT nextval('perigeu_config_id_seq'),
    chave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL
);

CREATE TABLE perigeu_procedures (
    id BIGINT PRIMARY KEY DEFAULT nextval('perigeu_procedures_id_seq'),
    descricao TEXT,
    parameters TEXT
);

CREATE TABLE perigeu_routes (
    id BIGINT PRIMARY KEY DEFAULT nextval('perigeu_routes_id_seq'),
    method VARCHAR(10),
    path TEXT,
    script TEXT
);

CREATE TABLE perigeu_scripts (
    id BIGINT PRIMARY KEY DEFAULT nextval('perigeu_scripts_id_seq'),
    descricao TEXT,
    chave VARCHAR(200),
    body TEXT
);

CREATE TABLE perigeu_utils (
    id BIGINT PRIMARY KEY DEFAULT nextval('perigeu_utils_id_seq'),
    chave VARCHAR(100),
    descricao TEXT
);

CREATE TABLE perigeu_script_dep (
    perigeu_script_id BIGINT,
    perigeu_script_dep_id BIGINT,
    FOREIGN KEY (perigeu_script_id) REFERENCES perigeu_scripts (id),
    FOREIGN KEY (perigeu_script_dep_id) REFERENCES perigeu_scripts (id)
);

CREATE TABLE perigeu_route_script_dep (
    perigeu_route_id BIGINT,
    perigeu_script_id BIGINT,
    ordem INT,
    FOREIGN KEY (perigeu_route_id) REFERENCES perigeu_routes (id),
    FOREIGN KEY (perigeu_script_id) REFERENCES perigeu_scripts (id)
);

CREATE TABLE perigeu_route_utils_dep (
    perigeu_route_id BIGINT,
    perigeu_utils_id BIGINT,
    FOREIGN KEY (perigeu_route_id) REFERENCES perigeu_routes (id),
    FOREIGN KEY (perigeu_utils_id) REFERENCES perigeu_utils (id)
);
