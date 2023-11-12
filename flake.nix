{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.default = pkgs.mkShell {
        packages = with pkgs; [ 
          (python3.withPackages (ps: [ps.starlette ps.uvicorn ps.sqlalchemy ps.greenlet ps.asyncpg ps.cryptography]))
          nodejs
        ];
      };
    });
}
