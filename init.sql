-- Suppression des tables existantes
DROP TABLE IF EXISTS attachements;
DROP TABLE IF EXISTS applications_attachements;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS job_descriptions;
DROP TABLE IF EXISTS job_offers;
DROP TABLE IF EXISTS recruiter_requests;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;




-- Table 'Organisations'
CREATE TABLE IF NOT EXISTS organizations(
    siren VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    type ENUM('association', 'sarl', 'eurl', 'sasu'),
    headquarter VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive'),
    creation_date DATE NOT NULL
);


-- Table 'Utilisateurs'
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(64) PRIMARY KEY,
    password VARCHAR(24) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    account_creation_date DATE NOT NULL,
    account_status ENUM('active', 'inactive') NOT NULL,
    type ENUM('candidate', 'recruiter', 'admin') DEFAULT 'candidate' NOT NULL,
    organization VARCHAR(64),
    FOREIGN KEY(organization) REFERENCES organizations(siren)
);


-- Table 'Offres d'emplois'
CREATE TABLE IF NOT EXISTS job_offers (
    id INT(8) AUTO_INCREMENT PRIMARY KEY,
    status ENUM('editing', 'published', 'expired') DEFAULT 'editing' NOT NULL,
    validity_date DATE NOT NULL,
    info VARCHAR(255) NOT NULL,
    recruiter VARCHAR(64) NOT NULL,
    organization VARCHAR(64) NOT NULL,
    FOREIGN KEY (recruiter) REFERENCES users(email),
    FOREIGN KEY (organization) REFERENCES organizations(siren)
);

-- Table 'Fiches de poste'
CREATE TABLE IF NOT EXISTS job_descriptions (
    id INT(8) AUTO_INCREMENT PRIMARY KEY,
    job_offer INT(8) UNIQUE NOT NULL,
    job_title VARCHAR(128),
    job_desc LONGTEXT,
    job_place VARCHAR(32),
    job_status VARCHAR(32),
    job_type VARCHAR(32),
    salary_min INT(8) DEFAULT 0 NOT NULL,
    salary_max INT(8) DEFAULT 0 NOT NULL,
    work_hours INT(8) NOT NULL,
    telework BOOLEAN NOT NULL,
    FOREIGN KEY(job_offer) REFERENCES job_offers(id) 
);

-- Table 'Candidatures'
CREATE TABLE IF NOT EXISTS applications (
    job_offer INT(8) AUTO_INCREMENT,
    candidate VARCHAR(64),
    date DATE NOT NULL,
    status ENUM ('accepted', 'refused', 'pending') NOT NULL,
    PRIMARY KEY (job_offer, candidate),
    FOREIGN KEY (job_offer) REFERENCES job_offers(id),
    FOREIGN KEY (candidate) REFERENCES users(email)
);

-- Table 'Pièces jointes'
CREATE TABLE IF NOT EXISTS attachements (
    uuid VARCHAR(36),
    job_offer INT(8),
    candidate VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    type ENUM('CV', 'MotivationLetter', 'Other') NOT NULL,
    PRIMARY KEY (uuid),
    FOREIGN KEY (job_offer, candidate) REFERENCES applications(job_offer, candidate)
);

-- Table 'Requêtes recruteurs'
CREATE TABLE IF NOT EXISTS recruiter_requests (
    candidate VARCHAR(64),
    organization VARCHAR(64),
    status ENUM('accepted', 'refused', 'pending') NOT NULL,
    date DATE NOT NULL,
    PRIMARY KEY (candidate, organization),
    FOREIGN KEY (candidate) REFERENCES users(email),
    FOREIGN KEY (organization) REFERENCES organizations(siren)
);