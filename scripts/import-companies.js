const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Matkhau@240196",
  database: "postgres",
});

const csvFilePath = path.join(
  __dirname,
  "..",
  "data",
  "seed",
  "seed_companies.csv"
);

function normalizeBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "t", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "f", "0", "no", "n"].includes(normalized)) return false;

  return defaultValue;
}

function cleanValue(value) {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

async function importCompanies() {
  await client.connect();
  console.log("Connected to PostgreSQL");

  const parser = fs.createReadStream(csvFilePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  let insertedCount = 0;
  let skippedCount = 0;
  let rowNumber = 1;

  try {
    for await (const row of parser) {
      rowNumber++;

      const name = cleanValue(row.name);

      if (!name) {
        console.log(`Skipping row ${rowNumber}: missing name`);
        console.log(row);
        skippedCount++;
        continue;
      }

      const values = [
        name,
        cleanValue(row.website_url),
        cleanValue(row.careers_url),
        cleanValue(row.linkedin_url),
        cleanValue(row.location_city),
        cleanValue(row.location_state),
        cleanValue(row.country) || "USA",
        cleanValue(row.industry),
        cleanValue(row.company_size),
        cleanValue(row.notes),
        normalizeBoolean(row.is_target, true),
      ];

      const query = `
        INSERT INTO companies (
          name,
          website_url,
          careers_url,
          linkedin_url,
          location_city,
          location_state,
          country,
          industry,
          company_size,
          notes,
          is_target
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
      `;

      await client.query(query, values);
      insertedCount++;
    }

    console.log(`Import complete.`);
    console.log(`Inserted: ${insertedCount}`);
    console.log(`Skipped: ${skippedCount}`);
  } catch (error) {
    console.error("Import failed:", error);
  } finally {
    await client.end();
    console.log("Disconnected from PostgreSQL");
  }
}

importCompanies();