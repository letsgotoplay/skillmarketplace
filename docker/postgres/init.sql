-- Initialize database with required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE skillmarketplace TO skillmarket;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillmarket;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillmarket;
