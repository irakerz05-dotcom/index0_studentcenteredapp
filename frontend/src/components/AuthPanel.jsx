import { LockKeyhole, Mail, UserRound, X } from "lucide-react";

export default function AuthPanel({
  mode,
  draft,
  status,
  onModeChange,
  onDraftChange,
  onSubmit,
  onClose,
}) {
  const isSignup = mode === "signup";

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel auth-panel" aria-label={isSignup ? "Create account" : "Log in"}>
        <button className="panel-close modal-close" type="button" aria-label="Close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="modal-heading">
          <UserRound size={24} />
          <div>
            <h2>{isSignup ? "Create Account" : "Log In"}</h2>
            <p>{isSignup ? "Save places, review services, and add new student spots." : "Use your student account."}</p>
          </div>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          {isSignup ? (
            <label>
              <span>Full name</span>
              <input
                value={draft.fullName}
                onChange={(event) => onDraftChange({ ...draft, fullName: event.target.value })}
                placeholder="Juan Dela Cruz"
                required
              />
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                value={draft.email}
                onChange={(event) => onDraftChange({ ...draft, email: event.target.value })}
                placeholder="student@email.com"
                required
              />
            </div>
          </label>
          <label>
            <span>Password</span>
            <div className="input-with-icon">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={draft.password}
                onChange={(event) => onDraftChange({ ...draft, password: event.target.value })}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
          </label>
          {isSignup ? (
            <label>
              <span>School</span>
              <input
                value={draft.school}
                onChange={(event) => onDraftChange({ ...draft, school: event.target.value })}
                placeholder="Your school"
              />
            </label>
          ) : null}

          <button className="primary-action" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
          </button>
          {status && status !== "saving" ? <p className="form-status">{status}</p> : null}
        </form>

        <button className="text-switch" type="button" onClick={() => onModeChange(isSignup ? "login" : "signup")}>
          {isSignup ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
      </section>
    </div>
  );
}
