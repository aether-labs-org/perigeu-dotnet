-- MARIADB DATABASE

CREATE TABLE perigeu_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL,
    valor LONGTEXT NOT NULL
);

CREATE TABLE perigeu_procedures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    descricao LONGTEXT,
    parameters LONGTEXT
);

CREATE TABLE perigeu_routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    method VARCHAR(10),
    path LONGTEXT,
    script LONGTEXT
);

CREATE TABLE perigeu_scripts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    descricao LONGTEXT,
    chave VARCHAR(200),
    body LONGTEXT
);

CREATE TABLE perigeu_utils (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100),
    descricao LONGTEXT
);

CREATE TABLE perigeu_script_dep (
    perigeu_script_id BIGINT,
    perigeu_script_dep_id BIGINT
);

CREATE TABLE perigeu_route_script_dep (
    perigeu_route_id BIGINT,
    perigeu_script_id BIGINT,
    ordem INT
);

CREATE TABLE perigeu_route_utils_dep (
    perigeu_route_id BIGINT,
    perigeu_utils_id BIGINT
);

-- ALTERAÇÕES DE CONSTRAINT (Nomes únicos configurados)

ALTER TABLE perigeu_route_script_dep
    ADD CONSTRAINT fk_route_script
        FOREIGN KEY (perigeu_route_id)
            REFERENCES perigeu_routes (id);

ALTER TABLE perigeu_route_utils_dep
    ADD CONSTRAINT fk_route_utils
        FOREIGN KEY (perigeu_route_id)
            REFERENCES perigeu_routes (id);

ALTER TABLE perigeu_route_utils_dep
    ADD CONSTRAINT fk_utils
        FOREIGN KEY (perigeu_utils_id)
            REFERENCES perigeu_utils (id);

ALTER TABLE perigeu_script_dep
    ADD CONSTRAINT fk_script
        FOREIGN KEY (perigeu_script_id)
            REFERENCES perigeu_scripts (id);

ALTER TABLE perigeu_script_dep
    ADD CONSTRAINT fk_dep
        FOREIGN KEY (perigeu_script_dep_id)
            REFERENCES perigeu_scripts (id);