# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
import pty, os, sys, time, signal, fcntl, re, struct, termios

signal.signal(signal.SIGPIPE, signal.SIG_DFL)

ACC_HOME = sys.argv[1]
master_fd, slave_fd = pty.openpty()
try:
    fcntl.ioctl(slave_fd, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 200, 0, 0))
except Exception:
    pass
pid = os.fork()
if pid == 0:
    os.close(master_fd)
    os.setsid()
    os.dup2(slave_fd, 0)
    os.dup2(slave_fd, 1)
    os.dup2(slave_fd, 2)
    if slave_fd > 2:
        os.close(slave_fd)
    os.environ["TERM"] = "xterm-256color"
    os.environ["HOME"] = ACC_HOME
    os.environ["GEMINI_DIR"] = ACC_HOME
    try:
        os.chdir(ACC_HOME)
    except Exception:
        pass
    os.execv("/usr/local/bin/agy", ["agy"])
else:
    os.close(slave_fd)
    with open("/tmp/.agy_bridge_pid", "w") as pf:
        pf.write(str(os.getpid()))

    with open("/tmp/agy_output", "w") as of:
        of.write("")
    with open("/tmp/agy_cmd", "w") as cf:
        cf.write("")

    output_buf = b""
    clean_buf = ""
    lines = []
    last_cmd = ""
    last_action_time = 0.0
    tos_toggled = False

    def _flush_output():
        try:
            if len(clean_buf) > 200000:
                tail_part = clean_buf[-200000:]
            else:
                tail_part = clean_buf
            with open("/tmp/agy_output", "w") as of:
                of.write(tail_part)
        except Exception:
            pass

    def _debug(msg):
        try:
            with open("/tmp/bridge_debug.log", "a") as f:
                f.write(str(time.time()) + ": " + msg + "\n")
        except Exception:
            pass

    _flush_output()
    DOWN_ARROW = b"\x1b[B"
    ENTER_KEY = b"\r"

    while True:
        try:
            cmd = ""
            try:
                with open("/tmp/agy_cmd", "r") as cf:
                    cmd = cf.read().strip()
            except FileNotFoundError:
                pass
            if cmd and cmd != last_cmd:
                last_cmd = cmd
                with open("/tmp/agy_cmd", "w") as cf:
                    cf.write("")
                if cmd == "QUIT":
                    try:
                        os.write(master_fd, b"\x03")
                    except OSError:
                        pass
                    time.sleep(0.5)
                    break

                is_auth_code = len(cmd) > 10 and not cmd.startswith("login") and not cmd.startswith("auth")
                wide = "\n".join(lines[-15:]).lower()
                at_code_prompt = (
                    ("authorization code" in wide and ("..." in wide or "paste" in wide))
                    or "paste the authorization code" in wide
                )

                if is_auth_code and not at_code_prompt:
                    with open("/tmp/agy_cmd", "w") as cf:
                        cf.write(cmd)
                    last_cmd = ""
                    time.sleep(0.5)
                    continue

                try:
                    os.write(master_fd, (cmd + "\r").encode("utf-8"))
                    _debug("Typed command into agy (code sent)")
                    time.sleep(0.3)
                except OSError:
                    pass

            try:
                fcntl.fcntl(master_fd, fcntl.F_SETFL,
                            fcntl.fcntl(master_fd, fcntl.F_GETFL) | os.O_NONBLOCK)
                data = os.read(master_fd, 4096)
            except OSError:
                data = b""
            if data:
                output_buf += data
                if len(output_buf) > 400000:
                    output_buf = output_buf[-200000:]
                try:
                    text = output_buf.decode("utf-8", errors="ignore")
                except Exception:
                    text = ""
                clean_buf = re.sub(r"\x1b\]8;[^;]*;([^\x07\x1b]*)(?:\x07|\x1b\\)", r"\1", text)
                clean_buf = re.sub(r"\x1b\[[0-9;?]*[a-zA-Z@^_{}|~]", "", clean_buf)
                clean_buf = re.sub(r"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)", "", clean_buf)
                clean_buf = clean_buf.replace("\x1b", "").replace("\x07", "")
                lines = clean_buf.splitlines()
                _flush_output()

            now = time.time()
            if not lines or now - last_action_time < 0.5:
                time.sleep(0.12)
                continue

            last5 = "\n".join(lines[-5:]).lower()
            last15 = "\n".join(lines[-15:]).lower()
            flat8 = re.sub(r"\s+", " ", "\n".join(lines[-8:]).lower())

            auth_prompt = (
                ("authorization code" in last15 and ("..." in last15 or "paste" in last15))
                or "paste the authorization code" in last15
            )

            if auth_prompt:
                pass
            elif "signing in" in last5 or "generating" in last5:
                pass
            elif "color scheme" in last5 or "[next]" in last5 or "press enter to continue" in last5:
                _debug("ENTER: onboarding carousel")
                os.write(master_fd, ENTER_KEY)
                last_action_time = now
            elif "[previous] [done]" in flat8:
                if not tos_toggled and "> [x] yes, i agree" in flat8:
                    _debug("SPACE: decline Interactions data collection")
                    os.write(master_fd, b" ")
                    tos_toggled = True
                    time.sleep(0.2)
                elif not tos_toggled:
                    tos_toggled = True
                _debug("ENTER: terms of service done")
                os.write(master_fd, ENTER_KEY)
                last_action_time = now
            elif (
                "do you trust" in last5
                or "trust the contents" in last5
                or "yes, i trust this folder" in last5
                or "trust this folder" in last5
                or "confirm gemini" in last5
                or "flash · high" in last5
            ):
                _debug("ENTER: trust / confirm prompt")
                os.write(master_fd, ENTER_KEY)
                last_action_time = now
            elif (
                "google cloud sign-in method" in last5
                or "continue with google cloud" in last5
                or "use advanced sso" in last5
            ):
                _debug("ENTER: google cloud sign-in method")
                os.write(master_fd, ENTER_KEY)
                last_action_time = now
            elif (
                "select login method" in last5
                or "navigate · enter select" in last5
                or "use a google cloud project" in last5
            ):
                _debug("ENTER: select login method")
                os.write(master_fd, ENTER_KEY)
                last_action_time = now

            time.sleep(0.12)
        except KeyboardInterrupt:
            break

    try:
        os.close(master_fd)
    except Exception:
        pass
    try:
        os.kill(pid, signal.SIGTERM)
    except Exception:
        pass
    try:
        os.waitpid(pid, 0)
    except Exception:
        pass
    try:
        os.remove("/tmp/.agy_bridge_pid")
    except Exception:
        pass
