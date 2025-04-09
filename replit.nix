{pkgs}: {
  deps = [
    pkgs.lsof
    pkgs.sqlite-interactive
    pkgs.postgresql
    pkgs.openssl
  ];
}
