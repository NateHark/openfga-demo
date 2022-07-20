#!/usr/bin/env bash

FAIL=0
TASK_COUNT=${1:-8}

echo $TASK_COUNT

echo "Starting perf test tasks"
for i in $(seq 1 $TASK_COUNT)
do
    npm run test:perf &
done

echo "Waiting on task completion..."
for job in `jobs -p`
do
    echo $job
    wait $job || let "FAIL+=1"
done

echo $FAIL

if [ "$FAIL" == "0" ];
then
    echo "All tasks succeeded"
else
    echo "Tasks failed ($FAIL)"
fi