# Chatterbox

## Demo

![Chatterbox Demo](./demo.gif)

## Introduction

Chatterbox is a tool for managing datasets for training LLMs. It's a user-friendly tool for creating human (and later synthetic) datasets for training. 

Particularly, Chatterbox is designed for managing multi-turn instruct/RP style datasets.

Features so far:

- Create/edit/delete conversations
- Token counting for every conversation (you choose the model)
- Tagging for every conversation
- Add/edit/delete messages (with highlighted markup)
- Add/edit rejected alternative for assistant messages
- Warnings for detected slop in messages
- Warning if messages are wrongly ordered
- Import CCv2 character cards
- Add/edit/delete characters from text definitions
- Add/edit/delete exchangeable system prompts
- Add/edit/delete exchangeable user personas
- Export datasets as sharegpt

To do:

- Connection to popular AI backends - OpenRouter & Kobold first
- Generate responses (with option to generate 2 and choose 1 for ORPO)
- Import SillyTavern convos with auto-link to character/persona if imported
- ORPO/DPO multi-turn export
- More... (put suggestions in GitHub issues)

## Local Setup

If you need any help, ask on [our Discord server](https://discord.gg/gXQzQcnedb).

### Docker-Compose (Recommended)

You will need Docker and Compose installed, the easiest way to get both is to install [Docker Desktop](https://docs.docker.com/desktop/).

Then just run:

```bash
docker-compose up --build
```

And when it's done the application will be available on [http://localhost:3000](http://localhost:3000).

### Manual Setup (For development)

#### Database

You will need a Postgresql database running.

##### Install Postgresql

###### Mac OS X

I'll assume you're using homebrew:

```bash
# Install postgresql
brew install postgresql
# Start the service
pg_ctl -D /usr/local/var/postgres start
```

###### Ubuntu Linux

Postgres can be installed from aptitude:

```bash
# Install Postgres
sudo apt install postgresql
# Make Postgres start on bootup
systemctl enable postgresql
# Start postgres
systemctl start postgresql
```

##### Setting up the database

Now create a database, then connect to it:

```bash
# Create the Database
createdb chatterbox
# Connect to the Database
psql chatterbox
```

And create a user to connect to it (note: if you're making this service publicly accessible to others, you may want to use more fine grained permissions):

```sql
-- Create the user
create user chatterbox with encrypted password 'test';
-- Give the user 'root' access to the database
grant all privileges on database chatterbox to chatterbox;
```

Now your database is good to go.

#### Backend

##### Connecting to the Database

Make sure your database string is correct in the env (you may want to add this to `~/.bashrc` or whatever shell you use):

```bash
# Create a DATABASE_URL environment variable
export DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost/DATABASE
```

Make sure your database string is correct in `alembic.ini` too:

```ini
sqlalchemy.url = postgresql://chatterbox:test@localhost/chatterbox
```

##### Starting the Server

Then it should be as simple as this:

```bash
# Move to the api directory
cd api
# Install the dependencies
pip install -r requirements.txt
# Run the database migrations
alembic upgrade head
# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 3001
```

#### Frontend

This part's simple:

```bash
# Tell the frontend where to find the API (again add this to .bashrc or equivalent)
export API_URL=http://localhost:3001
# Install dependencies
npm install
# Start the frontend
npm run start
```

## Troubleshooting

### failed to bind port 0.0.0.0:5432/tcp

If you get a message like this when starting the docker container, it's likely that you already have postgresql running locally. If you do, you should stop your local copy of postgresql.

You could also change the port, but it's more complex than it should be.