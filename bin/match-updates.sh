#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Distribute resources to empires
$DIR/console eoe:match:distribute-resources >> $DIR/../var/log/resources.log 2>> $DIR/../var/log/resources.error &
