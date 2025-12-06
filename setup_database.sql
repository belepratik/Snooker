-- Create database
CREATE DATABASE IF NOT EXISTS snooker_db;
USE snooker_db;

-- Table for studios/clubs
CREATE TABLE IF NOT EXISTS masterstudio (
    Studio VARCHAR(100) PRIMARY KEY,
    ownerPass VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for operators
CREATE TABLE IF NOT EXISTS operators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Operator_name VARCHAR(100),
    password VARCHAR(255),
    studio VARCHAR(100),
    role VARCHAR(50) DEFAULT 'operator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for master players
CREATE TABLE IF NOT EXISTS masterplayer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    players VARCHAR(100),
    total DECIMAL(10,2) DEFAULT 0,
    tablemoney DECIMAL(10,2) DEFAULT 0,
    studio VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for leaderboard
CREATE TABLE IF NOT EXISTS leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Players VARCHAR(100),
    studio VARCHAR(100),
    Status INT DEFAULT 0,
    Matches_On INT DEFAULT 0,
    Matches_Off INT DEFAULT 0,
    Total_Frame INT DEFAULT 0,
    coins DECIMAL(10,2) DEFAULT 0,
    My_win DECIMAL(10,2) DEFAULT 0,
    My_loss DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for table details
CREATE TABLE IF NOT EXISTS tabledets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id VARCHAR(50),
    table_name VARCHAR(100),
    studio VARCHAR(100),
    status INT DEFAULT 0,
    total_duration INT DEFAULT 0,
    In_Tournament INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for charges/pricing
CREATE TABLE IF NOT EXISTS charges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    STP VARCHAR(100),
    fixedRate DECIMAL(10,2),
    slot1 DECIMAL(10,2),
    slot2 DECIMAL(10,2),
    slot3 DECIMAL(10,2),
    slot4 DECIMAL(10,2),
    slot5 DECIMAL(10,2),
    slot6 DECIMAL(10,2),
    studio VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for frames (active matches)
CREATE TABLE IF NOT EXISTS frames (
    FrameId VARCHAR(100) PRIMARY KEY,
    TableId VARCHAR(50),
    Studio VARCHAR(100),
    StartTime DATETIME,
    OffTime DATETIME,
    Duration INT,
    durationBkp INT,
    Status VARCHAR(20) DEFAULT 'ON',
    Players TEXT,
    Winner VARCHAR(100),
    Plus DECIMAL(10,2) DEFAULT 0,
    fixedCharge DECIMAL(10,2) DEFAULT 0,
    TotalMoney2 DECIMAL(10,2) DEFAULT 0,
    split VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Studio) REFERENCES masterstudio(Studio)
);

-- Table for topup transactions
CREATE TABLE IF NOT EXISTS topup (
    id INT AUTO_INCREMENT PRIMARY KEY,
    RecordDate DATETIME,
    UserName VARCHAR(100),
    amount DECIMAL(10,2),
    studio VARCHAR(100),
    mode VARCHAR(50),
    BATM VARCHAR(100),
    operator VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for purchase transactions
CREATE TABLE IF NOT EXISTS purchase (
    id INT AUTO_INCREMENT PRIMARY KEY,
    RecordDate DATETIME,
    UserName VARCHAR(100),
    amount DECIMAL(10,2),
    studio VARCHAR(100),
    Item TEXT,
    operator VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for adjustments
CREATE TABLE IF NOT EXISTS adjustment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    RecordDate DATETIME,
    amount DECIMAL(10,2),
    studio VARCHAR(100),
    losser VARCHAR(100),
    winner VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for master items
CREATE TABLE IF NOT EXISTS masteritem (
    sno INT AUTO_INCREMENT PRIMARY KEY,
    itemname VARCHAR(100),
    price DECIMAL(10,2),
    stocks INT DEFAULT 0,
    studio VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for expenses
CREATE TABLE IF NOT EXISTS expense (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studio VARCHAR(100),
    amount DECIMAL(10,2),
    purpose TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Table for operator logs
CREATE TABLE IF NOT EXISTS operatorLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    studio VARCHAR(100),
    role VARCHAR(50),
    operatorId VARCHAR(100),
    action VARCHAR(100),
    details TEXT,
    operatorName VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio) REFERENCES masterstudio(Studio)
);

-- Insert sample studio data
INSERT INTO masterstudio (Studio, ownerPass) VALUES 
('Demo Studio', 'admin123')
ON DUPLICATE KEY UPDATE ownerPass = ownerPass;

-- Insert sample table data
INSERT INTO tabledets (table_id, table_name, studio, status) VALUES 
('T1', 'Table 1', 'Demo Studio', 0),
('T2', 'Table 2', 'Demo Studio', 0),
('T3', 'Table 3', 'Demo Studio', 0)
ON DUPLICATE KEY UPDATE status = status;

-- Insert sample charges
INSERT INTO charges (STP, fixedRate, slot1, slot2, slot3, slot4, slot5, slot6, studio) VALUES 
('Demo Studio-2', 100, 50, 50, 50, 50, 50, 50, 'Demo Studio')
ON DUPLICATE KEY UPDATE fixedRate = fixedRate;
