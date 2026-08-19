#!/usr/bin/env bash
# Fleeted backend acceptance test — full ride lifecycle over HTTP.
# Usage: ./scripts/demo-api.sh   (server must be running on :4000 with seeded DB)
set -euo pipefail

BASE="${BASE_URL:-http://localhost:4000}"
PASS=0
FAIL=0

req() { # req <method> <path> <token-or-empty> [body-file]
  local method="$1" path="$2" token="$3" body="${4:-}"
  local args=(-s -o /tmp/fleeted-body.json -w "%{http_code}" -X "$method" "$BASE$path" --max-time 5)
  if [ -n "$token" ]; then args+=(-H "Authorization: Bearer $token"); fi
  if [ -n "$body" ]; then args+=(-H "Content-Type: application/json" --data-binary "@$body"); fi
  curl "${args[@]}"
}

check() { # check <expected> <actual> <name>
  if [ "$1" = "$2" ]; then PASS=$((PASS + 1)); echo "  ok   $3 ($2)";
  else FAIL=$((FAIL + 1)); echo "  FAIL $3: expected $1 got $2"; fi
}

jsonget() { # jsonget <path> — reads /tmp/fleeted-body.json
  node -e "const b=JSON.parse(require('fs').readFileSync('/tmp/fleeted-body.json','utf8'));console.log(eval('b.'+process.argv[1]))" "$1"
}

body() { printf '%s' "$1" > /tmp/fleeted-req.json; }

echo "== logins =="
body '{"role":"CUSTOMER","name":"Priya Nair"}'
CODE=$(req POST /api/auth/login "" /tmp/fleeted-req.json); check 200 "$CODE" "login customer"
CTOKEN=$(jsonget token)
body '{"role":"VENDOR","name":"Royal Rides India"}'
CODE=$(req POST /api/auth/login "" /tmp/fleeted-req.json); check 200 "$CODE" "login vendor"
VTOKEN=$(jsonget token)
body '{"role":"OPS","name":"Ananya Desai"}'
CODE=$(req POST /api/auth/login "" /tmp/fleeted-req.json); check 200 "$CODE" "login ops"
OTOKEN=$(jsonget token)

echo "== lifecycle =="
FUTURE=$(node -e "console.log(new Date(Date.now()+3600000).toISOString())")
body "{\"modelId\":\"model-lincoln-towncar\",\"pickup\":\"The Oberoi, New Delhi\",\"dropoff\":\"Leela Palace, New Delhi\",\"pickupTime\":\"$FUTURE\",\"distanceKm\":15}"
CODE=$(req POST /api/rides "$CTOKEN" /tmp/fleeted-req.json); check 201 "$CODE" "customer books ride"
RIDE=$(jsonget id); check MATCHING "$(jsonget status)" "ride is MATCHING"

CODE=$(req GET /api/vendors/vendor-royal-rides/offers "$VTOKEN"); check 200 "$CODE" "vendor lists offers"
OFFER=$(jsonget "find(o=>o.vendorId==='vendor-royal-rides'&&o.status==='PENDING').id")

body '{"vendorCarId":"car-royal-1","chauffeurId":"chauffeur-royal-1"}'
CODE=$(req POST "/api/offers/$OFFER/accept" "$VTOKEN" /tmp/fleeted-req.json); check 200 "$CODE" "vendor accepts offer"
check ACCEPTED "$(jsonget status)" "offer ACCEPTED"

CODE=$(req POST "/api/ops/offers/$OFFER/approve" "$OTOKEN"); check 200 "$CODE" "ops approves offer"
check CONFIRMED "$(jsonget status)" "ride CONFIRMED"

body '{"role":"DRIVER","name":"Arjun Khanna"}'
CODE=$(req POST /api/auth/login "" /tmp/fleeted-req.json); check 200 "$CODE" "login assigned driver"
DTOKEN=$(jsonget token)

CODE=$(req POST "/api/driver/rides/$RIDE/start" "$DTOKEN"); check 200 "$CODE" "driver starts ride"
check STARTED "$(jsonget status)" "ride STARTED"
CODE=$(req POST "/api/driver/rides/$RIDE/complete" "$DTOKEN"); check 200 "$CODE" "driver completes ride"
check COMPLETED "$(jsonget status)" "ride COMPLETED"

CODE=$(req GET "/api/ops/rides/$RIDE" "$OTOKEN"); check 200 "$CODE" "ops reads ride detail"
check COMPLETED "$(jsonget status)" "detail shows COMPLETED"
check "Arjun Khanna" "$(jsonget 'assignment.chauffeur.name')" "assignment has chauffeur"

echo "== cancel-after-accept =="
body "{\"modelId\":\"model-rolls-ghost\",\"pickup\":\"Taj Palace, Mumbai\",\"dropoff\":\"JW Marriott, Mumbai\",\"pickupTime\":\"$FUTURE\",\"distanceKm\":20}"
CODE=$(req POST /api/rides "$CTOKEN" /tmp/fleeted-req.json); check 201 "$CODE" "book second ride"
RIDE2=$(jsonget id)
CODE=$(req GET /api/vendors/vendor-royal-rides/offers "$VTOKEN"); check 200 "$CODE" "offers for second ride"
OFFER2=$(jsonget "find(o=>o.vendorId==='vendor-royal-rides'&&o.status==='PENDING').id")
body '{"vendorCarId":"car-royal-4","chauffeurId":"chauffeur-royal-2"}'
CODE=$(req POST "/api/offers/$OFFER2/accept" "$VTOKEN" /tmp/fleeted-req.json); check 200 "$CODE" "accept second offer"
CODE=$(req POST "/api/rides/$RIDE2/cancel" "$CTOKEN"); check 200 "$CODE" "customer cancels ride"
check CANCELLED "$(jsonget status)" "ride CANCELLED"
CODE=$(req GET /api/vendors/vendor-royal-rides/offers "$VTOKEN"); check 200 "$CODE" "vendor sees released offers"
check RELEASED "$(jsonget "find(o=>o.rideId==='$RIDE2').status")" "offer RELEASED"

echo "== guards =="
CODE=$(req GET /api/ops/rides "$CTOKEN"); check 403 "$CODE" "customer blocked from ops"
CODE=$(req GET /api/rides/mine ""); check 401 "$CODE" "anonymous blocked"
CODE=$(req GET /api/car-models ""); check 200 "$CODE" "public catalog"

echo
echo "demo-api: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ]