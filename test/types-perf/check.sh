#!/bin/sh
set -eu

workloads="default-components default-components-simple polymorphic-html polymorphic-component theme-single theme-all form-typical form-deep form-wide-deep select-generics mixed-app"

if [ "$#" -gt 0 ]; then
  workloads="$*"
fi

for workload in $workloads; do
  echo "==> $workload"
  tsc -p "test/types-perf/$workload/tsconfig.json" --checkers 1
 done
