# Chatterbox

## Demo

![Chatterbox Demo](./demo.gif)

## Introduction

Chatterbox is a tool for managing datasets for training LLMs. It's a user-friendly tool for creating human (and later synthetic) datasets for training. Particularly, Chatterbox is designed for managing instruct/RP style datasets.

Features so far:

- Create/edit/delete conversations
- Token counting for every conversation (you choose the model)
- Tagging for every conversation
- Add/edit/delete messages (with highlighted markup)
- Warnings for detected slop in messages
- Warning if messages are wrongly ordered
- Import CCv2 character cards
- Add/edit/delete characters from text definitions
- Add/edit/delete exchangeable system prompts
- Add/edit/delete exchangeable user personas
- Export datasets as sharegpt

## Local Setup

*Local setup is still a bit of a process, Chatterbox is alpha software and I haven't added a nice one-stage startup yet. You need to be comfortable with the command line to run this.*

If you need any help, ask on [our Discord server](https://discord.gg/gXQzQcnedb).

### Database

You will need a Postgresql database running.

#### Install Postgresql

##### Mac OS X

I'll assume you're using homebrew:

```bash
# Install postgresql
brew install postgresql
# Start the service
pg_ctl -D /usr/local/var/postgres start
```

##### Ubuntu Linux

Postgres can be installed from aptitude:

```bash
# Install Postgres
sudo apt install postgresql
# Make Postgres start on bootup
systemctl enable postgresql
# Start postgres
systemctl start postgresql
```

#### Setting up the database

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

### Backend

#### Connecting to the Database

Make sure your database string is correct in the env (you may want to add this to `~/.bashrc` or whatever shell you use):

```bash
# Create a DATABASE_URL environment variable
export DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost/DATABASE
```

Make sure your database string is correct in `alembic.ini` too:

```ini
sqlalchemy.url = postgresql://chatterbox:test@localhost/chatterbox
```

#### Starting the Server

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

### Frontend

This part's simple:

```bash
# Tell the frontend where to find the API (again add this to .bashrc or equivalent)
export API_URL=http://localhost:3001
# Install dependencies
npm install
# Start the frontend
npm run start
```

I'll improve the process (probably with docker-compose) when the software is more stable.