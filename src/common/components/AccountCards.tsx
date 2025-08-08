import { Accordion, Paper, ScrollArea, Stack } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import type { DatabaseInfo } from "@/bindings";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { sessionsAtom } from "@/state/atoms";
import { getChessComAccount, getStats } from "@/utils/chess.com/api";
import { getLichessAccount } from "@/utils/lichess/api";
import type { Session } from "@/utils/session";

function AccountCards({
  databases,
  setDatabases,
}: {
  databases: DatabaseInfo[];
  setDatabases: React.Dispatch<React.SetStateAction<DatabaseInfo[]>>;
}) {
  const sessions = useAtomValue(sessionsAtom);
  const playerNames = Array.from(
    new Set(
      sessions
        .map((s) => s.player ?? s.lichess?.username ?? s.chessCom?.username)
        .filter((n): n is string => typeof n === "string" && n.length > 0),
    ),
  );

  const playerSessions = playerNames.map((name) => ({
    name,
    sessions: sessions.filter(
      (s) => s.player === name || s.lichess?.username === name || s.chessCom?.username === name,
    ),
  }));

  return (
    <ScrollArea offsetScrollbars>
      <Stack>
        {playerSessions.map(({ name, sessions }) => (
          <PlayerSession key={name} name={name} sessions={sessions} databases={databases} setDatabases={setDatabases} />
        ))}
      </Stack>
    </ScrollArea>
  );
}

function PlayerSession({
  name,
  sessions,
  databases,
  setDatabases,
}: {
  name: string;
  sessions: Session[];
  databases: DatabaseInfo[];
  setDatabases: React.Dispatch<React.SetStateAction<DatabaseInfo[]>>;
}) {
  const [, setSessions] = useAtom(sessionsAtom);

  return (
    <Paper withBorder>
      <Accordion multiple chevronSize={14} chevronPosition="left">
        {sessions.map((session, i) => (
          <LichessOrChessCom
            key={
              session.lichess?.account.id ??
              (session.chessCom ? `chesscom:${session.chessCom.username}` : `session:${i}`)
            }
            name={name}
            session={session}
            databases={databases}
            setDatabases={setDatabases}
            setSessions={setSessions}
          />
        ))}
      </Accordion>
    </Paper>
  );
}

function LichessOrChessCom({
  name,
  session,
  databases,
  setDatabases,
  setSessions,
}: {
  name: string;
  session: Session;
  databases: DatabaseInfo[];
  setDatabases: React.Dispatch<React.SetStateAction<DatabaseInfo[]>>;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
}) {
  if (session.lichess?.account) {
    const account = session.lichess.account;
    const lichessSession = session.lichess;
    const totalGames =
      (account.perfs?.ultraBullet?.games ?? 0) +
      (account.perfs?.bullet?.games ?? 0) +
      (account.perfs?.blitz?.games ?? 0) +
      (account.perfs?.rapid?.games ?? 0) +
      (account.perfs?.classical?.games ?? 0) +
      (account.perfs?.correspondence?.games ?? 0);

    const stats = [];
    const speeds = ["bullet", "blitz", "rapid", "classical"] as const;

    if (account.perfs) {
      for (const speed of speeds) {
        const perf = account.perfs[speed];
        if (perf) {
          stats.push({
            value: perf.rating,
            label: speed,
            diff: perf.prog,
          });
        }
      }
    }

    return (
      <AccountCard
        key={account.id}
        name={name}
        token={lichessSession.accessToken}
        type="lichess"
        database={databases.find((db) => db.filename === `${account.username}_lichess.db3`) ?? null}
        title={account.username}
        updatedAt={session.updatedAt}
        total={totalGames}
        setSessions={setSessions}
        logout={() => {
          setSessions((sessions) => sessions.filter((s) => s.lichess?.account.id !== account.id));
        }}
        setDatabases={setDatabases}
        reload={async () => {
          const account = await getLichessAccount({
            token: lichessSession.accessToken,
            username: lichessSession.username,
          });
          if (!account) return;
          setSessions((sessions) =>
            sessions.map((s) =>
              s.lichess?.account.id === account.id
                ? {
                    ...s,
                    lichess: {
                      account: account,
                      username: lichessSession.username,
                      accessToken: lichessSession.accessToken,
                    },
                    updatedAt: Date.now(),
                  }
                : s,
            ),
          );
        }}
        stats={stats}
      />
    );
  }
  if (session.chessCom?.stats) {
    let totalGames = 0;
    for (const stat of Object.values(session.chessCom.stats)) {
      if (stat.record) {
        totalGames += stat.record.win + stat.record.loss + stat.record.draw;
      }
    }

    const database = databases.find((db) => db.filename === `${session.chessCom?.username}_chesscom.db3`) ?? null;
    if (database && database.type === "success") {
      totalGames = Math.max(totalGames, database.game_count ?? 0);
    }
    return (
      <AccountCard
        key={session.chessCom.username}
        name={name}
        type="chesscom"
        title={session.chessCom.username}
        database={database}
        updatedAt={session.updatedAt}
        total={totalGames}
        stats={getStats(session.chessCom.stats)}
        setSessions={setSessions}
        logout={() => {
          setSessions((sessions) => sessions.filter((s) => s.chessCom?.username !== session.chessCom?.username));
        }}
        reload={async () => {
          if (!session.chessCom) return;
          const stats = await getChessComAccount(session.chessCom?.username);
          if (!stats) return;
          setSessions((sessions) =>
            sessions.map((s) =>
              session.chessCom && s.chessCom?.username === session.chessCom?.username
                ? {
                    ...s,
                    chessCom: {
                      username: session.chessCom?.username,
                      stats,
                    },
                    updatedAt: Date.now(),
                  }
                : s,
            ),
          );
        }}
        setDatabases={setDatabases}
      />
    );
  }
}

export default AccountCards;
