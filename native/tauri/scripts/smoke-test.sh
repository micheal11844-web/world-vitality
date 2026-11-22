#!/usr/bin/env bash
# Starts the built app once against a pretend site on this machine and checks
# that it opens, goes to the site (the page it starts on checks the site, then
# navigates to it) and tells the site who it is. This is the one check that
# needs a real Windows or Mac.
#
# Usage: smoke-test.sh <path to the app's program> <version>
set -u

program="${1:?path to the program}"
version="${2:?version}"
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
seen="${work}/seen.txt"
port=3107
touch "${seen}"

node "${here}/pretend-site.cjs" "${port}" "${seen}" &
site_pid=$!
# The app checks the site the moment it starts, so the site must be listening first.
for _ in $(seq 1 30); do
  if (echo > "/dev/tcp/127.0.0.1/${port}") 2> /dev/null; then break; fi
  sleep 1
done
# That check is itself a request; start the count again.
: > "${seen}"
WV_APP_URL="http://127.0.0.1:${port}" "${program}" > "${work}/app.log" 2>&1 &
app_pid=$!

ok=0
for _ in $(seq 1 90); do
  # Two requests: the start page's reachability check, then the navigation to the site.
  if grep -q "WorldVitalityDesktop/${version}" "${seen}" && [ "$(wc -l < "${seen}")" -ge 2 ]; then
    ok=1
    break
  fi
  sleep 1
done

alive=0
if kill -0 "${app_pid}" 2> /dev/null; then alive=1; fi
sleep 2
if kill -0 "${app_pid}" 2> /dev/null; then :; else alive=0; fi

echo "--- requests the pretend site saw (address, then browser identity):"
cat "${seen}"
echo "--- the app's own output:"
cat "${work}/app.log"

kill "${app_pid}" "${site_pid}" 2> /dev/null || true
if command -v taskkill > /dev/null 2>&1; then
  taskkill //F //IM world-vitality.exe > /dev/null 2>&1 || true
fi

if [ "${ok}" = 1 ] && [ "${alive}" = 1 ]; then
  echo "SMOKE TEST PASSED: the app opened, reached the site and named itself WorldVitalityDesktop/${version}."
  exit 0
fi
echo "SMOKE TEST FAILED: reached-site-and-named-itself=${ok} still-running=${alive}"
exit 1
