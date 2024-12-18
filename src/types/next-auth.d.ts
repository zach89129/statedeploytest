import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      venues: {
        id: string;
        trxVenueId: number;
        venueName: string;
      }[];
      isSuperuser: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    venues: {
      id: string;
      trxVenueId: number;
      venueName: string;
    }[];
    isSuperuser: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    venues: {
      id: string;
      trxVenueId: number;
      venueName: string;
    }[];
    isSuperuser: boolean;
  }
}
