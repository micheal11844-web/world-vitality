#!/usr/bin/env bash
# Starts the built app once against a pretend site on this machine and checks,
# in the real web view of the system it is running on, that it:
#   - opens, goes to the site (the page it starts on checks the site, then
#     navigates to it) and tells the site who it is           [must pass]
#   - refuses an address it must not go to (file:)             [must pass]
# and reports, without failing the build because the runner is a virtual
# machine: WebGL, service workers, whether a download the site makes lands in
# the Downloads folder, and whether a link to the site's own address opens in
# the same window.
#
# This is the one check that needs a real Windows or Mac.
#
# Usage: smoke-test.sh <path to the app's program> <version>
set -u

program="${1:?path to the program}"
version="${2:?version}"
here="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
seen="${work}/seen.txt"
report="${work}/report.txt"
port=3107
touch "${seen}" "${report}"

node "${here}/pretend-site.cjs" "${port}" "${seen}" "${report}" &
site_pid=$!
# The app checks the site the moment it starts, so the site must be listening first.
for _ in $(seq 1 30); do
  if (echo > "/dev/tcp/127.0.0.1/${port}") 2> /dev/null; then break; fi
  sleep 1
done
# That check is itself a request; start again from nothing.
: > "${seen}"
: > "${report}"

downloads="${HOME}/Downloads"
mkdir -p "${downloads}"

WV_APP_URL="http://127.0.0.1:${port}" "${program}" > "${work}/app.log" 2>&1 &
app_pid=$!

# 1. Reached the site and named itself: two requests (the start page's check, then the navigation).
reached=0
for _ in $(seq 1 90); do
  if grep -q "WorldVitalityDesktop/${version}" "${seen}" && [ "$(wc -l < "${seen}")" -ge 2 ]; then
    reached=1
    break
  fi
  sleep 1
done

# 2. The page's own tests report back (the first report arrives about five seconds after load).
first=""
for _ in $(seq 1 45); do
  first="$(grep '"stage":"first"' "${report}" | head -n 1)"
  if [ -n "${first}" ]; then break; fi
  sleep 1
done
# 3. A link to the site's own address, opened as a new window, should land in this window.
second=0
for _ in $(seq 1 20); do
  if grep -q '"stage":"second"' "${report}"; then
    second=1
    break
  fi
  sleep 1
done

alive=0
if kill -0 "${app_pid}" 2> /dev/null; then alive=1; fi

echo "--- requests the pretend site saw (address, then browser identity):"
cat "${seen}"
echo "--- what the page reported from inside the app's window:"
cat "${report}"
echo "--- the app's own output:"
cat "${work}/app.log"

# Judge.
agent_ok=0
refused=0
case "${first}" in *"WorldVitalityDesktop/${version}"*) agent_ok=1 ;; esac
case "${first}" in *'"fileAddressRefused":true'*) refused=1 ;; esac

name="$(printf '%s' "${first}" | sed -n 's/.*"downloadName":"\([^"]*\)".*/\1/p')"
downloaded=no
if [ -n "${name}" ] && ls "${downloads}"/wv-smoke-*.csv > /dev/null 2>&1; then
  downloaded=yes
fi

kill "${app_pid}" "${site_pid}" 2> /dev/null || true
if command -v taskkill > /dev/null 2>&1; then
  taskkill //F //IM world-vitality.exe > /dev/null 2>&1 || true
fi

echo "--- summary"
echo "reached the site and named itself: ${reached}"
echo "the page's own browser identity names the app: ${agent_ok}"
echo "a file: address was refused: ${refused}"
echo "still running: ${alive}"
echo "(information) WebGL: $(printf '%s' "${first}" | sed -n 's/.*"webgl":\([a-z]*\).*/\1/p'), WebGL2: $(printf '%s' "${first}" | sed -n 's/.*"webgl2":\([a-z]*\).*/\1/p'), service workers: $(printf '%s' "${first}" | sed -n 's/.*"serviceWorker":\([a-z]*\).*/\1/p'), saved data: $(printf '%s' "${first}" | sed -n 's/.*"localStorage":\([a-z]*\).*/\1/p')"
echo "(information) window size: $(printf '%s' "${first}" | sed -n 's/.*"innerWidth":\([0-9]*\).*"innerHeight":\([0-9]*\).*/\1 x \2/p')"
echo "(information) a download the site made landed in the Downloads folder: ${downloaded}"
echo "(information) a link to the site's own address opened in the same window: $([ "${second}" = 1 ] && echo yes || echo no)"

if [ "${reached}" = 1 ] && [ "${agent_ok}" = 1 ] && [ "${refused}" = 1 ] && [ "${alive}" = 1 ]; then
  echo "SMOKE TEST PASSED"
  exit 0
fi
echo "SMOKE TEST FAILED"
exit 1
