############################################################
# Dockerfile to build Hercules container images
# Based on Ubuntu
############################################################

FROM ubuntu:22.04
LABEL maintainer="steven.gray@ucl.ac.uk"

ENV NODE_VERSION=16.13.0

# Setup Dependices and Update
ENV DEBIAN_FRONTEND=noninteractive 
ENV TZ=Europe/London
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update
RUN apt-get install -y gnupg gnupg2
RUN apt-get install -y htop git curl
RUN apt-get install -y apt-utils apt-transport-https ca-certificates
RUN apt-get install -y software-properties-common

RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-cache policy python3.9
RUN apt-get install --no-install-recommends -y python3.9 python3.9-dev python3.9-venv python3-pip python3-wheel build-essential  
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# create and activate virtual environment
RUN python3.9 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python requirements
#COPY requirements.txt .
#RUN pip3 install --no-cache-dir -r requirements.txt

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

################## BEGIN GIT CHECKOUT #####################

RUN git clone https://github.com/djdunc/hercules.git /opt/hercules

################## BEGIN INSTALLATION #####################

# ---- Setup PostgresSQL ---------------------------------
# Postgres with Postgis
RUN apt-get update
RUN apt-get install wget nginx -y
RUN apt-get install dos2unix -y

RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
RUN apt-get update -y
RUN apt-get install postgresql-14 postgresql-client-14 postgresql-14-postgis-3 -y

USER postgres
RUN /etc/init.d/postgresql start &&\
    psql --command "CREATE USER docker WITH SUPERUSER PASSWORD 'docker';" &&\
    createdb -O docker hercules &&\
    psql -d hercules -c "CREATE EXTENSION postgis;"

RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/14/main/pg_hba.conf
RUN echo "listen_addresses='*'" >> /etc/postgresql/14/main/postgresql.conf

USER root
# ---- Copy Data Into the Database -------------------------------------
COPY sql_data/install_docker.sql /opt/sql/

# Script waits and checks for postgres to be ready
RUN service postgresql start && psql postgresql://docker:docker@127.0.0.1/hercules < /opt/sql/install_docker.sql

# ---- Setup nginx ---------------------------------
# Run command as root
RUN rm /etc/nginx/sites-enabled/default
COPY ./setup/nginx.conf /etc/nginx/sites-available/default
# Link the config file from sites-available to sites-enabled   
RUN ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# ---- Copy Backend Data -------------------------------------
USER root
COPY ./front-end /opt/html
COPY ./back-end /opt/viz

ENV HOME /opt/viz
WORKDIR /opt/viz/
RUN npm install 

COPY ./setup/entrypoint.sh /
RUN chmod +x /entrypoint.sh

EXPOSE 3000
EXPOSE 5432
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]

