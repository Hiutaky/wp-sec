import { Elysia,  t } from 'elysia';
import { scanSite } from './scanner';
import index from "./index.html";
import staticPlugin from './plugin/static';
import { env } from 'bun';


const app = new Elysia().post('/scan', async ({
    body: { url },
    status
}) => {
    if( ! url )
        return status(400, {
            error: "provide a valid url"
        })
    const scan = await scanSite(url);
    return status(200, scan);
}, {
    body: t.Object({
        url: t.String()
    }),
    response: {
        200: t.Object({
            plugins: t.Array(
                t.Object({
                    slug: t.String(),
                    name: t.String(),
                    version: t.String(),
                    url: t.String(),
                    vulnerabilities: t.Array(
                        t.Object({
                            name: t.String(),
                            score: t.String(),
                            affectedVersions: t.Array(t.String()),
                            sources: t.Array(
                                t.Object({
                                    name: t.String(),
                                    link: t.String()
                                })
                            )
                        })
                    )
                })
            )
        }),
        400: t.Object({
            error: t.String()
        })
    }
})

if( env.NODE_ENV === "production" )
    app.use( staticPlugin({
        indexHTML: true,
        assets: 'frontend/dist',
        prefix: '/',
        noCache: true
    }) )
else
    app.get('/', index )


app.listen(3000);

console.log(`WpSec is running at http://localhost:3000`)

export type App = typeof app;
