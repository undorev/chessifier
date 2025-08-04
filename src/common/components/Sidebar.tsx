import { AppShellSection, Stack, Tooltip } from "@mantine/core";
import {
  type Icon,
  IconBook,
  IconChess,
  IconCpu,
  IconDatabase,
  IconFiles,
  IconHome,
  IconKeyboard,
  IconSchool,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import cx from "clsx";
import { useTranslation } from "react-i18next";
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
  { icon: IconHome, label: "Home", url: "/" },
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

  const links = linksdata.map((link) => <NavbarLink {...link} label={t(`SideBar.${link.label}`)} key={link.label} />);

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
