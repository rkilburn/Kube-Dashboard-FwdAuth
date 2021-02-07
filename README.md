# Kubernetes Dashboard Forward Auth

This service gets the ServiceAccount for a token and injects it into an `Authorization` header for using with the Kubernetes Dashboard.

Intented use is as a forward auth endpoint for Traefik, providing the `x-remote-user` header has been set by some other proxy or forward auth mechanism.

Create service accounts tagged with a `user` annotation, with appropriate RoleBindings and deploy the manifests in `deployments`. Traefik will forward all requests to the fwdauth server which will inject the `Authorization` header with the value set to `Bearer <Service Account Token>`, effectively providing SSO for Kubernetes Dashboard.