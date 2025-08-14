# 🐳 Docker Development Setup

## PostgreSQL Database with Docker Compose

### Quick Start
```bash
# Start the database
docker-compose up -d

# Check if it's running
docker-compose ps

# View logs
docker-compose logs postgres

# Stop the database
docker-compose down
```

### Database Configuration
- **Host**: `localhost`
- **Port**: `15432` (unique port to avoid conflicts)
- **Database**: `travel_helper`
- **Username**: `postgres`
- **Password**: `password`

### Connection String
```
DATABASE_URL="postgresql://postgres:password@localhost:15432/travel_helper"
```

### First Time Setup
1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Update your `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Run Prisma migrations:**
   ```bash
   yarn prisma generate
   yarn prisma migrate dev --name init
   ```

4. **Start your Next.js app:**
   ```bash
   yarn dev
   ```

### Useful Commands
```bash
# Connect to database with psql
docker exec -it travel-helper-db psql -U postgres -d travel_helper

# Reset database (removes all data!)
docker-compose down -v
docker-compose up -d

# View database data directory
docker volume inspect travel-helper_postgres_data
```

### Database Management Tools
You can connect to the database using:
- **pgAdmin**: Connect to `localhost:15432`
- **TablePlus**: Connect to `localhost:15432` 
- **DataGrip**: Connect to `localhost:15432`
- **Command line**: `psql -h localhost -p 15432 -U postgres -d travel_helper`

### Troubleshooting
- **Port conflicts**: If port 15432 is busy, change it in `docker-compose.yml`
- **Permission issues**: Make sure Docker is running
- **Database won't start**: Check logs with `docker-compose logs postgres`
