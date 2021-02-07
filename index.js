const fs = require("fs");
const https = require('https')
const express = require("express");
const k8s = require('@kubernetes/client-node');

const app = express();

const KUBE_DASHBOARD_NAMESPACE = process.env.KUBE_DASHBOARD_NAMESPACE || "kube-dashboard";
const SERVICE_ACCOUNT_ANNOTIATION = process.env.SERVICE_ACCOUNT_ANNOTIATION || "user";
const USER_HEADER = process.env.USER_HEADER || "x-remote-user";


const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const namespaceTokenMap = new Map();

const path = '/api/v1/namespaces/' + KUBE_DASHBOARD_NAMESPACE + '/serviceaccounts';
const watch = new k8s.Watch(kc);

function handleEvent(type, serviceAccount, watchObj) {
    if (serviceAccount.metadata.annotations === undefined ||
            serviceAccount.metadata.annotations[SERVICE_ACCOUNT_ANNOTIATION] === undefined) {
                return; 
            }
    
    const serviceAccountUser = serviceAccount.metadata.annotations[SERVICE_ACCOUNT_ANNOTIATION];

    if (type === 'DELETED') {
        console.log("Removed token for " + serviceAccountUser);
        namespaceTokenMap.delete(serviceAccountUser);
    } else {
        k8sApi.readNamespacedSecret(serviceAccount.secrets[0].name, KUBE_DASHBOARD_NAMESPACE)
                .then(secret => {
                    const token = Buffer.from(secret.body.data['token'], 'base64').toString();
                    console.log("Added token for " + serviceAccountUser);
                    namespaceTokenMap.set(serviceAccountUser, token);
                })
    }
};

watch.watch(path, {}, handleEvent, console.log, console.error);

app.get("/token", (req, res) => { 
    const headerUser = req.headers[USER_HEADER];
    res.set("Authorization", "Bearer " + namespaceTokenMap.get(headerUser));
    res.send();
});

app.get("/healthz", (req, res) => { 
    res.send();
});

https.createServer({
    key: fs.readFileSync('/certs/tls.key'),
    cert: fs.readFileSync('/certs/tls.crt')
  }, app).listen(8443, () => {
    console.log("Listening on port: 8443");
  })