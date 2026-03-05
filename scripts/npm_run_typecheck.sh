#! /bin/bash
# This script works around a limitaion of vue-tsc which cannot exclude files from typechecking which are explcitly included or used in the code. See https://github.com/vuejs/language-tools/issues/3144#issuecomment-1875414251

set -uo pipefail

echo "Executing and filtering 'npm run typecheck-all'"
typecheck_output="$(npm run typecheck-all 2>&1)"
if (! echo "$typecheck_output" | grep 'ERROR' &> /dev/null) ||
    (echo "$typecheck_output" | grep 'ERROR' &> /dev/null &&
      echo "$typecheck_output" | grep 'TS[0-9]' &> /dev/null); then
  # filter for only the lines with the typescript errors
  typecheck_output=$(echo "${typecheck_output}" | grep 'TS[0-9]')
  # exclude folders
  typecheck_output=$(echo "${typecheck_output}" | grep -v '^node_modules/')

  if [ -n "${typecheck_output}" ]; then
    amountOfErrors=$(echo "$typecheck_output" | wc -l)
    echo "You have the following '$amountOfErrors' typescript errors:"
    echo ""
    # double each newline for better readability of the output
    echo "${typecheck_output}" | awk '{printf $0"\n\n"}'
    exit 1
  else
    echo "No typescript errors."
  fi
else
  echo "$typecheck_output"
  exit 1
fi
