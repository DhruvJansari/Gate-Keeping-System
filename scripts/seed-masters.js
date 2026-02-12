import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gatekeeping_db",
};

async function seed() {
  try {
    const conn = await mysql.createConnection(dbConfig);
    console.log("DB connected");

    await conn.execute(
      `INSERT IGNORE INTO items (item_name, description, status) VALUES
       ('MUSTARD CAKE', 'Mustard cake', 'Active'),
       ('MUSTARD SEED', 'Mustard seed', 'Active'),
       ('D OIL CAKE', 'D oil cake', 'Active'),
       ('RICE', 'Rice', 'Active'),
       ('WHEAT', 'Wheat', 'Active')`
    );

    await conn.execute(
      `INSERT IGNORE INTO parties (party_name, email, contact_phone, status) VALUES
       ('BANAS OIL MILL PVT LTD', 'dsds@gmail.com', '8989898988', 'Active'),
       ('jeel Patel', 'jeel@gmail.com', '07874440971', 'Active')`
    );

    await conn.execute(
      `INSERT IGNORE INTO transporters (name, contact_person, contact_phone, email, service_type, status) VALUES
       ('Transporter A', 'Contact A', '1111111111', 'a@transport.com', 'Road', 'Active'),
       ('Transporter B', 'Contact B', '2222222222', 'b@transport.com', 'Road', 'Active'),
       ('Transporter C', 'Contact C', '3333333333', 'c@transport.com', 'Road', 'Active'),
       ('Transporter D', 'Contact D', '4444444444', 'd@transport.com', 'Road', 'Active')`
    );

    console.log("Master data seeded");
    await conn.end();
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
