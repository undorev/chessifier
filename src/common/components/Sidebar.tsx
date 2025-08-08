import { AppShellSection, Stack, Tooltip } from "@mantine/core";
import {
  type Icon,
  IconChess,
  IconCpu,
  IconDatabase,
  IconFiles,
  IconKeyboard,
  IconLayoutGrid,
  IconSchool,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import cx from "clsx";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { hideDashboardOnStartupAtom } from "@/state/atoms";
import * as classes from "./Sidebar.css";

interface NavbarLinkProps {
  icon: Icon;
  label: string;
  url: string;
  active?: boolean;
}

function NavbarLink({ url, icon: Icon, label }: NavbarLinkProps) {
  const matcesRoute = useMatchRoute();
  return (
    <Tooltip label={label} position="right">
      <Link
        to={url}
        className={cx(classes.link, {
          [classes.active]: matcesRoute({ to: url, fuzzy: true }),
        })}
      >
        <Icon size="1.5rem" stroke={1.5} />
      </Link>
    </Tooltip>
  );
}

export const linksdata = [
  { icon: IconLayoutGrid, label: "Dashboard", url: "/" },
  { icon: IconChess, label: "Board", url: "/boards" },
  { icon: IconCpu, label: "Engines", url: "/engines" },
  {
    icon: IconDatabase,
    label: "Databases",
    url: "/databases",
  },
  { icon: IconFiles, label: "Files", url: "/files" },
  { icon: IconUsers, label: "Accounts", url: "/accounts" },
  { icon: IconSchool, label: "Learn", url: "/learn" },
];

export function SideBar() {
  const matcesRoute = useMatchRoute();
  const { t } = useTranslation();
  const [hideDashboardOnStartup] = useAtom(hideDashboardOnStartupAtom);

  const links = linksdata
    .filter((link) => {
      if (hideDashboardOnStartup && link.url === "/") return false;
      return link;
    })
    .map((link) => <NavbarLink {...link} label={t(`SideBar.${link.label}`)} key={link.label} />);

  return (
    <>
      <AppShellSection grow>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </AppShellSection>
      <AppShellSection>
        <Stack justify="center" gap={0}>
          <Tooltip label={t("SideBar.KeyboardShortcuts")} position="right">
            <Link
              to="/settings/keyboard-shortcuts"
              className={cx(classes.link, {
                [classes.active]: matcesRoute({ to: "/settings/keyboard-shortcuts", fuzzy: true }),
              })}
            >
              <IconKeyboard size="1.5rem" stroke={1.5} />
            </Link>
          </Tooltip>
          <Tooltip label={t("SideBar.Settings")} position="right">
            <Link
              to="/settings"
              className={cx(classes.link, {
                [classes.active]: matcesRoute({ to: "/settings" }),
              })}
            >
              <IconSettings size="1.5rem" stroke={1.5} />
            </Link>
          </Tooltip>
        </Stack>
      </AppShellSection>
    </>
  );
}
