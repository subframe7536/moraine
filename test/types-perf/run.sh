#!/bin/sh
set -eu

all_workloads="default-components default-components-simple polymorphic-html polymorphic-component theme-single theme-all form-typical form-deep form-wide-deep select-generics mixed-app"
workloads="$all_workloads"
if [ "$#" -gt 0 ]; then
  workloads="$*"
fi

runs="${TYPE_PERF_RUNS:-3}"
if [ "$runs" -lt 3 ]; then
  echo "TYPE_PERF_RUNS must be at least 3 for measured benchmarks" >&2
  exit 2
fi

label="${TYPE_PERF_LABEL:-current}"
out_root=".tmp/type-perf/$label"
mkdir -p "$out_root"

median_three() {
  printf '%s\n' "$1" "$2" "$3" | sort -n | sed -n '2p'
}

metric() {
  name="$1"
  file="$2"
  awk -v name="$name" '$1 == name ":" { print $2; exit }' "$file"
}

printf 'Workload\tFiles\tMoraine d.ts\tLines of Library\tLines of Definitions\tTypes\tInstantiations\tMemory median (K)\tAssignability cache\tCheck median (s)\tTotal median (s)\tPeak RSS median (bytes)\n'
for workload in $workloads; do
  config="test/types-perf/$workload/tsconfig.json"
  dir="$out_root/$workload"
  rm -rf "$dir"
  mkdir -p "$dir"

  i=1
  while [ "$i" -le "$runs" ]; do
    output="$dir/run-$i.txt"
    time_output="$dir/time-$i.txt"
    if [ "$(uname -s)" = "Darwin" ] && [ -x /usr/bin/time ]; then
      /usr/bin/time -l tsc -p "$config" --extendedDiagnostics --checkers 1 >"$output" 2>"$time_output"
    else
      tsc -p "$config" --extendedDiagnostics --checkers 1 >"$output" 2>"$time_output"
    fi
    i=$((i + 1))
  done

  first="$dir/run-1.txt"
  files=$(metric Files "$first")
  library=$(awk '/^Lines of Library:/ {print $4; exit}' "$first")
  definitions=$(awk '/^Lines of Definitions:/ {print $4; exit}' "$first")
  library=${library:-n/a}
  definitions=${definitions:-n/a}
  types=$(metric Types "$first")
  instantiations=$(metric Instantiations "$first")
  assignability=$(awk '/^Assignability cache size:/ {print $4; exit}' "$first")
  assignability=${assignability:-n/a}

  for deterministic in Files Types Instantiations; do
    expected=$(metric "$deterministic" "$first")
    i=2
    while [ "$i" -le "$runs" ]; do
      actual=$(metric "$deterministic" "$dir/run-$i.txt")
      if [ "$actual" != "$expected" ]; then
        echo "$workload: nondeterministic $deterministic ($expected != $actual)" >&2
        exit 3
      fi
      i=$((i + 1))
    done
  done

  memory1=$(awk '/^Memory used:/ {print $3; exit}' "$dir/run-1.txt" | sed 's/K$//')
  memory2=$(awk '/^Memory used:/ {print $3; exit}' "$dir/run-2.txt" | sed 's/K$//')
  memory3=$(awk '/^Memory used:/ {print $3; exit}' "$dir/run-3.txt" | sed 's/K$//')
  check1=$(awk '/^Check time:/ {value=$3; sub(/s$/, "", value); print value; exit}' "$dir/run-1.txt")
  check2=$(awk '/^Check time:/ {value=$3; sub(/s$/, "", value); print value; exit}' "$dir/run-2.txt")
  check3=$(awk '/^Check time:/ {value=$3; sub(/s$/, "", value); print value; exit}' "$dir/run-3.txt")
  total1=$(awk '/^Total time:/ {value=$3; sub(/s$/, "", value); print value; exit}' "$dir/run-1.txt")
  total2=$(awk '/^Total time:/ {value=$3; sub(/s$/, "", value); print value; exit}' "$dir/run-2.txt")
  total3=$(awk '/^Total time:/ {value=$3; sub(/s$/, "", value); print value; exit}' "$dir/run-3.txt")

  memory=$(median_three "$memory1" "$memory2" "$memory3")
  check=$(median_three "$check1" "$check2" "$check3")
  total=$(median_three "$total1" "$total2" "$total3")

  rss1=$(awk '/maximum resident set size/ {print $1; exit}' "$dir/time-1.txt")
  rss2=$(awk '/maximum resident set size/ {print $1; exit}' "$dir/time-2.txt")
  rss3=$(awk '/maximum resident set size/ {print $1; exit}' "$dir/time-3.txt")
  if [ -n "${rss1:-}" ] && [ -n "${rss2:-}" ] && [ -n "${rss3:-}" ]; then
    rss=$(median_three "$rss1" "$rss2" "$rss3")
  else
    rss="n/a"
  fi

  tsc -p "$config" --listFilesOnly --checkers 1 >"$dir/files.txt"
  moraine_declarations=$(grep '/dist/.*\.d\.mts$' "$dir/files.txt" | wc -l | tr -d ' ')

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$workload" "$files" "$moraine_declarations" "$library" "$definitions" "$types" "$instantiations" "$memory" "$assignability" "$check" "$total" "$rss"
done
