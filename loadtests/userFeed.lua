wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"
wrk.body = '{"query":"{userFeed{edges{node{id}}}}"}'
