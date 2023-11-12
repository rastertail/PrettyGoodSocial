{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system: let
      overlays = [ rust-overlay.overlays.default ];
      pkgs = import nixpkgs { inherit system overlays; };
    in {
      devShells.default = pkgs.mkShell {
        packages = (with pkgs; [ 
          (python3.withPackages (ps: [ps.starlette ps.uvicorn ps.sqlalchemy ps.greenlet ps.asyncpg ps.cryptography]))
          nodejs
          (rust-bin.selectLatestNightlyWith (toolchain: toolchain.default.override {
            extensions = [ "rust-src" "rust-analyzer" ];
          }))
          ravedude
        ]) ++ (with pkgs.pkgsCross.avr.buildPackages; [
          gcc binutils avrdude
        ]);
      };
    });
}
