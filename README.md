# Chatterbox

## Demo

![Chatterbox Demo](./demo2.gif)

## Introduction

Chatterbox is a free software tool for chatting with large language models, it can be used for building training datasets or just roleplaying (or a mix of both, if you prefer).

While most tools are character-focused, Chatterbox is conversation-focused. This means that your conversations can be filtered by persona, character, prompt and tags.

If you need any help, ask on [our Discord server](https://discord.gg/gXQzQcnedb).

## Features

- Roleplay with all your favorite characters
- Import Character Card v2 character cards
- Connect to koboldcpp to generate responses
- RP mode to simulate chat
- Manage prompts, personas, sampler presets &amp; characters
- Filter conversations by character, prompt, persona &amp; tags

### Dataset Features

- Generate synthetic datasets with 'autoplay' function
- Add rejected messages to any assistant response

### Todo List

See [TODO.md](./TODO.md).

## Local Setup

### Docker-Compose (Recommended)

You will need Docker and Compose installed, the easiest way to get both is to install [Docker Desktop](https://docs.docker.com/desktop/). On Windows Home Editions, you'll also need to [set up WSL2 with Ubuntu before installing Docker](https://documentation.ubuntu.com/wsl/en/latest/howto/install-ubuntu-wsl2/).

*Note: If this doesn't work, especially on Windows, check the **Troubleshooting** section at the bottom of this doc before opening an issue.*

Then just open a terminal and run the following commands (note: the 'run' file automatically updates the files):

#### Linux / Mac

```bash
git clone https://github.com/invisietch/Chatterbox.git
cd Chatterbox
./run.sh
```

#### Windows

```bash
git clone https://github.com/invisietch/Chatterbox.git
cd Chatterbox
run.bat
```

And when it's done (takes a few minutes the first time, and about 30-60 seconds thereafter on most machines) the application will be available on [http://localhost:3000](http://localhost:3000).

In future, just re-run `./run.sh` or `run.bat` (depending on your OS) to start Chatterbox again.

### Manual Setup (For development)

Only do this if you're planning to develop or if you really don't want to use Docker, it's a pain.

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

## Sponsorships

If you're using Chatterbox and getting something out of it, please consider a one-time or monthly sponsorship to help keep the project going.

If you can't afford to sponsor the project comfortably, please don't do it. I'm not strapped for cash, I just won't say no to a pizza or coffee for my work.

[Sponsor here](https://github.com/sponsors/invisietch).

## Troubleshooting

### Failed to bind port 0.0.0.0:5432/tcp

If you get a message like this when starting the docker container, it's likely that you already have postgresql running locally. If you do, you should stop your local copy of postgresql.

You could also change the port, but it's more complex than it should be.

### Docker issues on Windows

You need to install WSL2 and add a distribution (suggested Ubuntu).

First, make sure the permissions are set right:

```
Check in Windows Security -> App & Browser Control -> Exploit Protection Settings:

In System Settings, Control Flow Guard (CFG) should be "On".
In Program Settings, there should be entries for:

C:\Windows\System32\vmcompute.exe
C:\Windows\System32\vmwp.exe

Both should have Control Flow Guard set to:

- Override System Settings
- On
- Use Strict CFG
```

Then, install Ubuntu:

```
wsl.exe --install -d Ubuntu
```

Then, set the WSL version & default distro:

```
wsl.exe --set-version Ubuntu 2
wsl --set-default Ubuntu
```

Finally, restart your computer & Docker should work.

## License

Copyright 2025 invisietch

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.