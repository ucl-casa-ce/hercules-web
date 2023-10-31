#!/bin/bash

service postgresql start 

retry() {
  max_attempts="$1"; shift
  seconds="$1"; shift
  cmd="$@"
  attempt_num=1

  until $cmd
  do
    if [ $attempt_num -eq $max_attempts ]
    then
      echo "Attempt $attempt_num failed and there are no more attempts left!"
      return 1
    else
      echo "Attempt $attempt_num failed! Trying again in $seconds seconds..."
      attempt_num=`expr "$attempt_num" + 1`
      sleep "$seconds"
    fi
  done
}

retry 5 1 psql postgresql://docker:docker@127.0.0.1/hercules -c '\l' >/dev/null

echo >&2 "$(date +%Y%m%dt%H%M%S) Postgres is up - executing command"

/usr/bin/psql postgresql://docker:docker@127.0.0.1/hercules < /opt/sql/install_docker.sql