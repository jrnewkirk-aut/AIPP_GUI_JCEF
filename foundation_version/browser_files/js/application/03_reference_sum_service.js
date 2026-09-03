"use strict";
P2.application.registry.register("sum",values=>P2.client.request("application.example.sum.request",{values}));
